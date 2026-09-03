/// <reference path="../../env.d.ts" />
import { RPCHandler } from "@orpc/server/fetch";
import {
	processInboundMessage,
	storeRawToR2,
	type InboundQueueMessage,
} from "../../src/lib/email/inbound";
import { processOutboundQueue, type OutboundQueueMessage } from "../../src/lib/email/send";
import { getDb } from "../../src/db";
import { resolveInboundAddress } from "../../src/lib/email/routing";
import { isInboundQueueMessage } from "../../worker-utils";
import { app } from "./src/server/app";
import { createMailflareAuth } from "./src/server/auth";
import { getMailflareRole } from "./src/server/policy";
import { rejectCrossOriginMutation } from "./src/server/request-security";
import { rpcRouter } from "./src/server/rpc";
import startHandler from "./dist/server/index.js";

export { RealtimeHub } from "../../src/lib/realtime/hub";
export { DatabaseBackupWorkflow } from "../../src/lib/backups/workflow";

const rpcHandler = new RPCHandler(rpcRouter);
const modernRoutes: Record<string, true> = {
	"/": true,
	"/login": true,
	"/register": true,
	"/setup": true,
	"/inbox": true,
	"/settings": true,
	"/admin": true,
	"/compose": true,
	"/sent": true,
	"/drafts": true,
	"/archived": true,
	"/trash": true,
	"/spam": true,
	"/starred": true,
	"/snoozed": true,
	"/contacts": true,
	"/folders": true,
	"/calendar": true,
};
const protectedRoutes: Record<string, true> = {
	"/inbox": true,
	"/settings": true,
	"/admin": true,
	"/compose": true,
	"/sent": true,
	"/drafts": true,
	"/archived": true,
	"/trash": true,
	"/spam": true,
	"/starred": true,
	"/snoozed": true,
	"/contacts": true,
	"/folders": true,
	"/calendar": true,
};

async function handleRpc(request: Request, env: CloudflareEnv): Promise<Response> {
	const blocked = rejectCrossOriginMutation(request);
	if (blocked) return blocked;
	const result = await rpcHandler.handle(request, {
		prefix: "/api/rpc",
		context: { env, request },
	});
	if (result.matched) return result.response;
	return new Response("Not Found", { status: 404 });
}

async function hasSession(request: Request, env: CloudflareEnv): Promise<boolean> {
	const session = await createMailflareAuth(env).api.getSession({ headers: request.headers });
	return session !== null;
}

async function hasAdminSession(request: Request, env: CloudflareEnv): Promise<boolean> {
	const session = await createMailflareAuth(env).api.getSession({ headers: request.headers });
	return session !== null && (await getMailflareRole(env, session.user.id)) === "admin";
}

export default {
	async fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext) {
		const { pathname } = new URL(request.url);
		if (
			pathname === "/api/health" ||
			pathname === "/api/setup/admin" ||
			pathname.startsWith("/api/auth/")
		) {
			return app.fetch(request, env);
		}
		if (pathname.startsWith("/api/rpc")) return handleRpc(request, env);

		const isModernRoute =
			modernRoutes[pathname] || pathname.startsWith("/admin/") || pathname.startsWith("/settings/");
		if (!isModernRoute) return new Response("Not Found", { status: 404 });

		const isProtectedRoute =
			protectedRoutes[pathname] ||
			pathname.startsWith("/admin/") ||
			pathname.startsWith("/settings/");
		if (isProtectedRoute && !(await hasSession(request, env))) {
			return Response.redirect(new URL("/login", request.url), 302);
		}
		const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
		if (isAdminRoute && !(await hasAdminSession(request, env))) {
			return new Response("Forbidden", { status: 403 });
		}
		return startHandler.fetch(request, env, ctx);
	},

	async email(message: ForwardableEmailMessage, env: CloudflareEnv) {
		const decision = await resolveInboundAddress(getDb(env), message.to);
		if (!decision?.mailbox || decision.action !== "store") {
			message.setReject("Unknown recipient");
			return;
		}

		const rawR2Key = await storeRawToR2(env, message.from, message.to, message.raw);
		const payload: InboundQueueMessage = {
			from: message.from,
			to: message.to,
			rawR2Key,
			headers: Object.fromEntries(message.headers),
		};
		await env.INBOUND_QUEUE.send(payload);
	},

	async queue(batch: MessageBatch, env: CloudflareEnv) {
		for (const message of batch.messages) {
			try {
				if (isInboundQueueMessage(message.body)) {
					await processInboundMessage(env, message.body);
				} else {
					await processOutboundQueue(env, message.body as OutboundQueueMessage);
				}
				message.ack();
			} catch (error) {
				console.error("Queue processing failed", error);
				message.retry({ delaySeconds: 10 });
			}
		}
	},
} satisfies ExportedHandler<CloudflareEnv>;

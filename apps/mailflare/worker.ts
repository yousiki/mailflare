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
};
const protectedRoutes: Record<string, true> = {
	"/inbox": true,
	"/settings": true,
	"/admin": true,
	"/compose": true,
};

async function handleRpc(request: Request, env: CloudflareEnv): Promise<Response> {
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
		if (isModernRoute) {
			const isProtectedRoute =
				protectedRoutes[pathname] ||
				pathname.startsWith("/admin/") ||
				pathname.startsWith("/settings/");
			if (isProtectedRoute && !(await hasSession(request, env))) {
				return Response.redirect(new URL("/login", request.url), 302);
			}
			return startHandler.fetch(request, env, ctx);
		}
		return new Response("Not Found", { status: 404 });
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

import { ORPCError, os } from "@orpc/server";
import { z } from "zod";
import { createMailflareAuth } from "./auth";
import { listMailboxesForUser } from "./mailboxes";
import { sendEmail } from "../../../../src/lib/email/send";

export type MailflareRpcContext = {
	env: CloudflareEnv;
	request: Request;
};

const rpc = os.$context<MailflareRpcContext>();
const emptyInput = z.object({});
const sessionUser = z.object({
	id: z.string(),
	email: z.email(),
	name: z.string(),
});

const withSession = rpc.use(async ({ context, next }) => {
	const session = await createMailflareAuth(context.env).api.getSession({
		headers: context.request.headers,
	});
	if (!session) throw new ORPCError("UNAUTHORIZED", { message: "Sign in to continue." });
	return next({ context: { session } });
});

export const healthProcedure = rpc
	.route({ method: "POST", path: "/health" })
	.input(emptyInput)
	.output(z.object({ service: z.literal("mailflare"), status: z.literal("ok") }))
	.handler(() => ({ service: "mailflare" as const, status: "ok" as const }));

export const authMeProcedure = rpc
	.route({ method: "POST", path: "/auth/me" })
	.input(emptyInput)
	.output(z.object({ user: sessionUser.nullable() }))
	.handler(async ({ context }) => {
		const session = await createMailflareAuth(context.env).api.getSession({
			headers: context.request.headers,
		});
		return { user: session ? sessionUser.parse(session.user) : null };
	});

export const mailboxListProcedure = withSession
	.route({ method: "POST", path: "/mailboxes/list" })
	.input(emptyInput)
	.output(z.array(z.object({ id: z.string(), email: z.email(), name: z.string() })))
	.handler(({ context }) => listMailboxesForUser(context.env, context.session.user.id));

const sendInput = z.object({
	mailboxId: z.string().min(1),
	from: z.string().min(3).max(320),
	to: z.email(),
	subject: z.string().max(998),
	text: z.string().max(1_000_000),
});

export const messageSendProcedure = withSession
	.route({ method: "POST", path: "/messages/send" })
	.input(sendInput)
	.output(z.object({ messageId: z.string() }))
	.handler(({ context, input }) =>
		sendEmail(context.env, {
			...input,
			userId: context.session.user.id,
		}),
	);

export const rpcRouter = rpc.router({
	health: healthProcedure,
	auth: { me: authMeProcedure },
	mailboxes: { list: mailboxListProcedure },
	messages: { send: messageSendProcedure },
});

export type MailflareRpcRouter = typeof rpcRouter;

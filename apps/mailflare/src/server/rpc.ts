import { ORPCError, os } from "@orpc/server";
import { z } from "zod";
import { sendEmail } from "../../../../src/lib/email/send";
import { createMailflareAuth } from "./auth";
import { listBackupsForUser, startBackupForUser } from "./backups";
import { listCalendarEventsForUser } from "./calendar";
import { listContactsForUser } from "./contacts";
import { listDomainsForUser, provisionDomainForUser } from "./domains";
import { listFoldersForUser } from "./folders";
import { createMailboxForUser, listMailboxesForUser } from "./mailboxes";
import {
	getMessageForUser,
	markMessageRead,
	toggleMessageStar,
	updateMessageStatus,
} from "./message-actions";
import { listMessagesForUser, type MessageFolder } from "./messages";
import {
	createApiKey,
	createWebhook,
	listAdminUsers,
	listApiKeys,
	listAuditActivity,
	listRoutingRules,
	listWebhooks,
} from "./admin";
import { requireAdmin } from "./policy";

export type MailflareRpcContext = { env: CloudflareEnv; request: Request };
const rpc = os.$context<MailflareRpcContext>();
const emptyInput = z.object({});
const sessionUser = z.object({ id: z.string(), email: z.email(), name: z.string() });
const withSession = rpc.use(async ({ context, next }) => {
	const session = await createMailflareAuth(context.env).api.getSession({
		headers: context.request.headers,
	});
	if (!session) throw new ORPCError("UNAUTHORIZED", { message: "Sign in to continue." });
	return next({ context: { session } });
});
const withAdmin = withSession.use(async ({ context, next }) => {
	await requireAdmin(context.env, context.session.user.id);
	return next();
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

export const domainListProcedure = withSession
	.route({ method: "POST", path: "/domains/list" })
	.input(emptyInput)
	.output(
		z.array(
			z.object({
				id: z.string(),
				hostname: z.string(),
				status: z.enum(["pending", "active", "error"]),
			}),
		),
	)
	.handler(({ context }) => listDomainsForUser(context.env, context.session.user.id));

export const domainAddProcedure = withAdmin
	.route({ method: "POST", path: "/domains/add" })
	.input(z.object({ hostname: z.string().trim().min(3).max(253) }))
	.output(
		z.object({
			id: z.string(),
			hostname: z.string(),
			status: z.enum(["pending", "active", "error"]),
		}),
	)
	.handler(({ context, input }) =>
		provisionDomainForUser(context.env, context.session.user.id, input.hostname),
	);

export const mailboxCreateProcedure = withAdmin
	.route({ method: "POST", path: "/mailboxes/create" })
	.input(
		z.object({
			domainId: z.string().min(1),
			localPart: z.string().trim().min(1).max(64),
			displayName: z.string().trim().max(120).optional(),
		}),
	)
	.output(z.object({ id: z.string(), email: z.email(), name: z.string() }))
	.handler(({ context, input }) =>
		createMailboxForUser(context.env, context.session.user.id, input),
	);

const messageListProcedure = withSession
	.route({ method: "POST", path: "/messages/list" })
	.input(
		z.object({
			mailboxId: z.string().optional(),
			folder: z
				.enum(["inbox", "sent", "drafts", "archived", "trash", "spam", "starred", "snoozed"])
				.optional(),
		}),
	)
	.output(
		z.array(
			z.object({
				id: z.string(),
				from: z.string(),
				to: z.string(),
				subject: z.string(),
				snippet: z.string(),
				direction: z.enum(["inbound", "outbound"]),
				read: z.boolean(),
				starred: z.boolean(),
				createdAt: z.date(),
			}),
		),
	)
	.handler(({ context, input }) =>
		listMessagesForUser(context.env, context.session.user.id, {
			mailboxId: input.mailboxId,
			folder: input.folder as MessageFolder | undefined,
		}),
	);

const messageGetProcedure = withSession
	.route({ method: "POST", path: "/messages/get" })
	.input(z.object({ messageId: z.string().min(1) }))
	.output(
		z
			.object({
				id: z.string(),
				from: z.string(),
				to: z.string(),
				subject: z.string(),
				snippet: z.string(),
				textBody: z.string().nullable(),
				htmlBody: z.string().nullable(),
				direction: z.enum(["inbound", "outbound"]),
				status: z.string(),
				read: z.boolean(),
				starred: z.boolean(),
				createdAt: z.date(),
			})
			.nullable(),
	)
	.handler(({ context, input }) =>
		getMessageForUser(context.env, context.session.user.id, input.messageId),
	);

const messageReadProcedure = withSession
	.route({ method: "POST", path: "/messages/read" })
	.input(z.object({ messageId: z.string().min(1), read: z.boolean().default(true) }))
	.output(z.object({ success: z.boolean() }))
	.handler(async ({ context, input }) => ({
		success: await markMessageRead(
			context.env,
			context.session.user.id,
			input.messageId,
			input.read,
		),
	}));

const messageStarProcedure = withSession
	.route({ method: "POST", path: "/messages/star" })
	.input(z.object({ messageId: z.string().min(1) }))
	.output(z.object({ starred: z.boolean().nullable() }))
	.handler(async ({ context, input }) => ({
		starred: await toggleMessageStar(context.env, context.session.user.id, input.messageId),
	}));

const messageStatusProcedure = withSession
	.route({ method: "POST", path: "/messages/status" })
	.input(
		z.object({
			messageId: z.string().min(1),
			status: z.enum([
				"received",
				"sent",
				"draft",
				"queued",
				"failed",
				"archived",
				"trash",
				"spam",
			]),
		}),
	)
	.output(z.object({ success: z.boolean() }))
	.handler(async ({ context, input }) => ({
		success: await updateMessageStatus(
			context.env,
			context.session.user.id,
			input.messageId,
			input.status,
		),
	}));

const messageSendProcedure = withSession
	.route({ method: "POST", path: "/messages/send" })
	.input(
		z.object({
			mailboxId: z.string().min(1),
			from: z.string().min(3).max(320),
			to: z.email(),
			subject: z.string().max(998),
			text: z.string().max(1_000_000),
		}),
	)
	.output(z.object({ messageId: z.string() }))
	.handler(({ context, input }) =>
		sendEmail(context.env, { ...input, userId: context.session.user.id }),
	);

const contactsListProcedure = withSession
	.route({ method: "POST", path: "/contacts/list" })
	.input(emptyInput)
	.output(
		z.array(
			z.object({
				id: z.string(),
				email: z.email(),
				displayName: z.string().nullable(),
				blocked: z.boolean(),
				lastSeenAt: z.date().nullable(),
			}),
		),
	)
	.handler(({ context }) => listContactsForUser(context.env, context.session.user.id));

const foldersListProcedure = withSession
	.route({ method: "POST", path: "/folders/list" })
	.input(z.object({ mailboxId: z.string().optional() }))
	.output(
		z.array(
			z.object({ id: z.string(), mailboxId: z.string(), name: z.string(), color: z.string() }),
		),
	)
	.handler(({ context, input }) =>
		listFoldersForUser(context.env, context.session.user.id, input.mailboxId),
	);

const calendarListProcedure = withSession
	.route({ method: "POST", path: "/calendar/list" })
	.input(z.object({ start: z.coerce.date().optional(), end: z.coerce.date().optional() }))
	.output(
		z.array(
			z.object({
				id: z.string(),
				title: z.string(),
				description: z.string(),
				location: z.string(),
				startsAt: z.date(),
				endsAt: z.date(),
				attendees: z.array(z.string()),
			}),
		),
	)
	.handler(({ context, input }) =>
		listCalendarEventsForUser(context.env, context.session.user.id, input.start, input.end),
	);

const adminUsersProcedure = withAdmin
	.route({ method: "POST", path: "/admin/users" })
	.input(emptyInput)
	.output(
		z.array(
			z.object({
				id: z.string(),
				email: z.email(),
				name: z.string(),
				role: z.enum(["admin", "user"]),
				disabled: z.boolean(),
			}),
		),
	)
	.handler(({ context }) => listAdminUsers(context.env));

const activityListProcedure = withAdmin
	.route({ method: "POST", path: "/admin/activity" })
	.input(emptyInput)
	.output(
		z.array(
			z.object({
				id: z.string(),
				action: z.string(),
				metadata: z.string().nullable(),
				createdAt: z.date(),
				actorEmail: z.email().nullable(),
			}),
		),
	)
	.handler(({ context }) => listAuditActivity(context.env));

const apiKeysListProcedure = withSession
	.route({ method: "POST", path: "/api-keys/list" })
	.input(emptyInput)
	.output(
		z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				prefix: z.string(),
				scopes: z.string(),
				createdAt: z.date(),
				lastUsedAt: z.date().nullable(),
			}),
		),
	)
	.handler(({ context }) => listApiKeys(context.env, context.session.user.id));

const apiKeyCreateProcedure = withSession
	.route({ method: "POST", path: "/api-keys/create" })
	.input(
		z.object({
			name: z.string().trim().min(1).max(120),
			scopes: z.array(z.enum(["send", "read"])).min(1),
		}),
	)
	.output(z.object({ id: z.string(), name: z.string(), prefix: z.string(), key: z.string() }))
	.handler(({ context, input }) =>
		createApiKey(context.env, context.session.user.id, input.name, input.scopes),
	);

const webhooksListProcedure = withAdmin
	.route({ method: "POST", path: "/admin/webhooks" })
	.input(emptyInput)
	.output(
		z.array(
			z.object({
				id: z.string(),
				url: z.url(),
				events: z.string(),
				enabled: z.boolean(),
				createdAt: z.date(),
			}),
		),
	)
	.handler(({ context }) => listWebhooks(context.env, context.session.user.id));

const webhookCreateProcedure = withAdmin
	.route({ method: "POST", path: "/admin/webhooks/create" })
	.input(z.object({ url: z.url(), events: z.array(z.string().min(1)).min(1) }))
	.output(
		z.object({ id: z.string(), url: z.url(), secret: z.string(), events: z.array(z.string()) }),
	)
	.handler(({ context, input }) =>
		createWebhook(context.env, context.session.user.id, input.url, input.events),
	);

const routingRulesListProcedure = withSession
	.route({ method: "POST", path: "/routing-rules/list" })
	.input(z.object({ mailboxId: z.string().min(1) }))
	.output(
		z.array(
			z.object({
				id: z.string(),
				domainId: z.string(),
				mailboxId: z.string().nullable(),
				pattern: z.string(),
				matchField: z.string(),
				matchOperator: z.string(),
				matchValue: z.string(),
				folderId: z.string().nullable(),
				action: z.string(),
				forwardTo: z.string().nullable(),
				priority: z.number(),
				createdAt: z.date(),
			}),
		),
	)
	.handler(({ context, input }) =>
		listRoutingRules(context.env, context.session.user.id, input.mailboxId),
	);

const backupsListProcedure = withAdmin
	.route({ method: "POST", path: "/backups/list" })
	.input(emptyInput)
	.output(
		z.array(
			z.object({
				id: z.string(),
				status: z.enum(["queued", "running", "completed", "failed"]),
				trigger: z.enum(["manual", "scheduled"]),
				filename: z.string().nullable(),
				size: z.number().nullable(),
				error: z.string().nullable(),
				createdAt: z.date(),
				completedAt: z.date().nullable(),
			}),
		),
	)
	.handler(({ context }) => listBackupsForUser(context.env, context.session.user.id));

const backupStartProcedure = withAdmin
	.route({ method: "POST", path: "/backups/start" })
	.input(emptyInput)
	.output(z.object({ backupId: z.string() }))
	.handler(async ({ context }) => ({
		backupId: await startBackupForUser(context.env, context.session.user.id),
	}));

export const rpcRouter = rpc.router({
	health: healthProcedure,
	auth: { me: authMeProcedure },
	mailboxes: { list: mailboxListProcedure, create: mailboxCreateProcedure },
	domains: { list: domainListProcedure, add: domainAddProcedure },
	messages: {
		list: messageListProcedure,
		get: messageGetProcedure,
		read: messageReadProcedure,
		star: messageStarProcedure,
		status: messageStatusProcedure,
		send: messageSendProcedure,
	},
	contacts: { list: contactsListProcedure },
	calendar: { list: calendarListProcedure },
	backups: { list: backupsListProcedure, start: backupStartProcedure },
	folders: { list: foldersListProcedure },
	admin: {
		users: adminUsersProcedure,
		activity: activityListProcedure,
		webhooks: { list: webhooksListProcedure, create: webhookCreateProcedure },
	},
	apiKeys: { list: apiKeysListProcedure, create: apiKeyCreateProcedure },
	routingRules: { list: routingRulesListProcedure },
});

export type MailflareRpcRouter = typeof rpcRouter;

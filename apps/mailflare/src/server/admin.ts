import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../../src/db";
import { generateApiKey, scopesToJson } from "../../../../src/lib/api-keys";
import { newId } from "../../../../src/lib/ids";
import {
	apiKeys,
	auditLogs,
	domains,
	routingRules,
	users,
	webhooks,
} from "../../../../src/db/schema";

export async function listAdminUsers(env: CloudflareEnv) {
	return getDb(env)
		.select({
			id: users.id,
			email: users.email,
			name: users.name,
			role: users.role,
			disabled: users.disabled,
		})
		.from(users)
		.orderBy(users.email)
		.limit(200);
}

export async function listAuditActivity(env: CloudflareEnv) {
	return getDb(env)
		.select({
			id: auditLogs.id,
			action: auditLogs.action,
			metadata: auditLogs.metadata,
			createdAt: auditLogs.createdAt,
			actorEmail: users.email,
		})
		.from(auditLogs)
		.leftJoin(users, eq(users.id, auditLogs.actorUserId))
		.where(inArray(auditLogs.action, ["auth.login", "auth.logout"]))
		.orderBy(desc(auditLogs.createdAt))
		.limit(200);
}

export async function listApiKeys(env: CloudflareEnv, userId: string) {
	return getDb(env)
		.select({
			id: apiKeys.id,
			name: apiKeys.name,
			prefix: apiKeys.prefix,
			scopes: apiKeys.scopes,
			createdAt: apiKeys.createdAt,
			lastUsedAt: apiKeys.lastUsedAt,
		})
		.from(apiKeys)
		.where(eq(apiKeys.userId, userId))
		.orderBy(desc(apiKeys.createdAt));
}

export async function createApiKey(
	env: CloudflareEnv,
	userId: string,
	name: string,
	scopes: string[],
) {
	const generated = generateApiKey();
	const id = newId("key");
	await getDb(env)
		.insert(apiKeys)
		.values({
			id,
			userId,
			name,
			prefix: generated.prefix,
			keyHash: generated.hash,
			scopes: scopesToJson(scopes),
		});
	return { id, name, prefix: generated.prefix, key: generated.fullKey };
}

export async function listWebhooks(env: CloudflareEnv, userId: string) {
	return getDb(env)
		.select({
			id: webhooks.id,
			url: webhooks.url,
			events: webhooks.events,
			enabled: webhooks.enabled,
			createdAt: webhooks.createdAt,
		})
		.from(webhooks)
		.where(eq(webhooks.userId, userId))
		.orderBy(desc(webhooks.createdAt));
}

export async function createWebhook(
	env: CloudflareEnv,
	userId: string,
	url: string,
	events: string[],
) {
	const id = newId("wh");
	const secret = newId("whsec");
	await getDb(env)
		.insert(webhooks)
		.values({ id, userId, url, secret, events: JSON.stringify(events), enabled: true });
	return { id, url, secret, events };
}

export async function listRoutingRules(env: CloudflareEnv, userId: string, mailboxId: string) {
	return getDb(env)
		.select({
			id: routingRules.id,
			domainId: routingRules.domainId,
			mailboxId: routingRules.mailboxId,
			pattern: routingRules.pattern,
			matchField: routingRules.matchField,
			matchOperator: routingRules.matchOperator,
			matchValue: routingRules.matchValue,
			folderId: routingRules.folderId,
			action: routingRules.action,
			forwardTo: routingRules.forwardTo,
			priority: routingRules.priority,
			createdAt: routingRules.createdAt,
		})
		.from(routingRules)
		.innerJoin(domains, eq(domains.id, routingRules.domainId))
		.where(and(eq(routingRules.userId, userId), eq(routingRules.mailboxId, mailboxId)))
		.orderBy(routingRules.priority);
}

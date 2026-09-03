import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../../../src/db";
import { domains, mailboxes } from "../../../../src/db/schema";
import { ensureMailboxDomainRouting } from "../../../../src/lib/mailboxes/domain-addresses";
import { newId } from "../../../../src/lib/ids";

export type MailboxSummary = {
	id: string;
	email: string;
	name: string;
};

export async function listMailboxesForUser(
	env: CloudflareEnv,
	userId: string,
): Promise<MailboxSummary[]> {
	const rows = await getDb(env)
		.select({
			id: mailboxes.id,
			email: sql<string>`${mailboxes.localPart} || '@' || ${domains.hostname}`,
			name: sql<string>`coalesce(${mailboxes.displayName}, ${mailboxes.localPart})`,
		})
		.from(mailboxes)
		.innerJoin(domains, eq(domains.id, mailboxes.domainId))
		.where(and(eq(mailboxes.userId, userId), eq(mailboxes.disabled, false)))
		.orderBy(mailboxes.createdAt);
	return rows.map((row) => ({
		id: row.id,
		email: row.email,
		name: row.name ?? row.email,
	}));
}

export type CreateMailboxInput = {
	domainId: string;
	localPart: string;
	displayName?: string;
};

export async function createMailboxForUser(
	env: CloudflareEnv,
	userId: string,
	input: CreateMailboxInput,
): Promise<MailboxSummary> {
	const db = getDb(env);
	const [domain] = await db.select().from(domains).where(eq(domains.id, input.domainId)).limit(1);
	if (!domain || domain.userId !== userId) throw new Error("Domain not found");
	const localPart = input.localPart.trim().toLowerCase();
	const [existing] = await db
		.select()
		.from(mailboxes)
		.where(and(eq(mailboxes.domainId, domain.id), eq(mailboxes.localPart, localPart)))
		.limit(1);
	if (existing) throw new Error("Mailbox already exists");

	const id = newId("mbx");
	await db.insert(mailboxes).values({
		id,
		userId,
		domainId: domain.id,
		localPart,
		displayName: input.displayName?.trim() || localPart,
	});
	try {
		await ensureMailboxDomainRouting(env, db, {
			id,
			domainId: domain.id,
			localPart,
			useAllDomains: true,
		});
	} catch (error) {
		await db.delete(mailboxes).where(eq(mailboxes.id, id));
		throw error;
	}
	return {
		id,
		email: `${localPart}@${domain.hostname}`,
		name: input.displayName?.trim() || localPart,
	};
}

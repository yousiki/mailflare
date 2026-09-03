import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../../../src/db";
import { domains, mailboxes } from "../../../../src/db/schema";

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
	return rows;
}

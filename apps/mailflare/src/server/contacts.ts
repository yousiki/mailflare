import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../src/db";
import { contacts } from "../../../../src/db/schema";

export type ContactSummary = {
	id: string;
	email: string;
	displayName: string | null;
	blocked: boolean;
	lastSeenAt: Date | null;
};

export async function listContactsForUser(
	env: CloudflareEnv,
	userId: string,
): Promise<ContactSummary[]> {
	return getDb(env)
		.select({
			id: contacts.id,
			email: contacts.email,
			displayName: contacts.displayName,
			blocked: contacts.blocked,
			lastSeenAt: contacts.lastSeenAt,
		})
		.from(contacts)
		.where(eq(contacts.userId, userId))
		.orderBy(asc(contacts.email));
}

import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../src/db";
import { messages } from "../../../../src/db/schema";

export type MessageSummary = {
	id: string;
	from: string;
	to: string;
	subject: string;
	snippet: string;
	direction: "inbound" | "outbound";
	read: boolean;
	starred: boolean;
	createdAt: Date;
};

export async function listMessagesForUser(
	env: CloudflareEnv,
	userId: string,
	mailboxId?: string,
): Promise<MessageSummary[]> {
	const rows = await getDb(env)
		.select({
			id: messages.id,
			from: messages.fromAddr,
			to: messages.toAddr,
			subject: messages.subject,
			snippet: messages.snippet,
			direction: messages.direction,
			read: messages.read,
			starred: messages.starred,
			createdAt: messages.createdAt,
		})
		.from(messages)
		.where(
			mailboxId
				? and(eq(messages.userId, userId), eq(messages.mailboxId, mailboxId))
				: eq(messages.userId, userId),
		)
		.orderBy(desc(messages.createdAt));

	return rows.map((row) => ({
		...row,
		subject: row.subject ?? "(no subject)",
		snippet: row.snippet ?? "",
	}));
}

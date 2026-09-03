import { and, desc, eq, gt, isNotNull } from "drizzle-orm";
import { getDb } from "../../../../src/db";
import { messages } from "../../../../src/db/schema";

export type MessageFolder =
	| "inbox"
	| "sent"
	| "drafts"
	| "archived"
	| "trash"
	| "spam"
	| "starred"
	| "snoozed";

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

function folderCondition(folder: MessageFolder) {
	if (folder === "inbox")
		return and(eq(messages.direction, "inbound"), eq(messages.status, "received"));
	if (folder === "sent") return eq(messages.direction, "outbound");
	if (folder === "drafts") return eq(messages.status, "draft");
	if (folder === "starred") return eq(messages.starred, true);
	if (folder === "snoozed")
		return and(isNotNull(messages.snoozedUntil), gt(messages.snoozedUntil, new Date()));
	return eq(messages.status, folder);
}

export async function listMessagesForUser(
	env: CloudflareEnv,
	userId: string,
	options: { mailboxId?: string; folder?: MessageFolder } = {},
): Promise<MessageSummary[]> {
	const conditions = [eq(messages.userId, userId)];
	if (options.mailboxId) conditions.push(eq(messages.mailboxId, options.mailboxId));
	if (options.folder) {
		const condition = folderCondition(options.folder);
		if (condition) conditions.push(condition);
	}

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
		.where(and(...conditions))
		.orderBy(desc(messages.createdAt));

	return rows.map((row) => ({
		...row,
		subject: row.subject ?? "(no subject)",
		snippet: row.snippet ?? "",
	}));
}

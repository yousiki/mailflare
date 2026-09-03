import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../src/db";
import { messages } from "../../../../src/db/schema";

export type MessageDetail = {
	id: string;
	from: string;
	to: string;
	subject: string;
	snippet: string;
	textBody: string | null;
	htmlBody: string | null;
	direction: "inbound" | "outbound";
	status: string;
	read: boolean;
	starred: boolean;
	createdAt: Date;
};

export async function getMessageForUser(
	env: CloudflareEnv,
	userId: string,
	messageId: string,
): Promise<MessageDetail | null> {
	const [message] = await getDb(env)
		.select({
			id: messages.id,
			from: messages.fromAddr,
			to: messages.toAddr,
			subject: messages.subject,
			snippet: messages.snippet,
			textBody: messages.textBody,
			htmlBody: messages.htmlBody,
			direction: messages.direction,
			status: messages.status,
			read: messages.read,
			starred: messages.starred,
			createdAt: messages.createdAt,
		})
		.from(messages)
		.where(and(eq(messages.id, messageId), eq(messages.userId, userId)))
		.limit(1);
	if (!message) return null;
	return { ...message, subject: message.subject ?? "(no subject)", snippet: message.snippet ?? "" };
}

export async function markMessageRead(
	env: CloudflareEnv,
	userId: string,
	messageId: string,
	read: boolean,
): Promise<boolean> {
	const result = await getDb(env)
		.update(messages)
		.set({ read })
		.where(and(eq(messages.id, messageId), eq(messages.userId, userId)));
	return result.meta.changes > 0;
}

export async function toggleMessageStar(
	env: CloudflareEnv,
	userId: string,
	messageId: string,
): Promise<boolean | null> {
	const db = getDb(env);
	const [message] = await db
		.select({ starred: messages.starred })
		.from(messages)
		.where(and(eq(messages.id, messageId), eq(messages.userId, userId)))
		.limit(1);
	if (!message) return null;
	const starred = !message.starred;
	await db
		.update(messages)
		.set({ starred })
		.where(and(eq(messages.id, messageId), eq(messages.userId, userId)));
	return starred;
}

export async function updateMessageStatus(
	env: CloudflareEnv,
	userId: string,
	messageId: string,
	status: string,
): Promise<boolean> {
	const result = await getDb(env)
		.update(messages)
		.set({ status })
		.where(and(eq(messages.id, messageId), eq(messages.userId, userId)));
	return result.meta.changes > 0;
}

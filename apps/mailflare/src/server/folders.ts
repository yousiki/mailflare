import { asc, and, eq } from "drizzle-orm";
import { getDb } from "../../../../src/db";
import { folders } from "../../../../src/db/schema";

export type FolderSummary = {
	id: string;
	mailboxId: string;
	name: string;
	color: string;
};

export async function listFoldersForUser(
	env: CloudflareEnv,
	userId: string,
	mailboxId?: string,
): Promise<FolderSummary[]> {
	return getDb(env)
		.select({
			id: folders.id,
			mailboxId: folders.mailboxId,
			name: folders.name,
			color: folders.color,
		})
		.from(folders)
		.where(
			mailboxId
				? and(eq(folders.userId, userId), eq(folders.mailboxId, mailboxId))
				: eq(folders.userId, userId),
		)
		.orderBy(asc(folders.name));
}

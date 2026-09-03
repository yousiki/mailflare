import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../src/db";
import { backups } from "../../../../src/db/schema";
import { createBackupRecord } from "../../../../src/lib/backups/service";
import { getBackupWorkflowBinding } from "../../../../src/lib/backups/utils";

export type BackupSummary = {
	id: string;
	status: "queued" | "running" | "completed" | "failed";
	trigger: "manual" | "scheduled";
	filename: string | null;
	size: number | null;
	error: string | null;
	createdAt: Date;
	completedAt: Date | null;
};

export async function listBackupsForUser(
	env: CloudflareEnv,
	userId: string,
): Promise<BackupSummary[]> {
	const rows = await getDb(env)
		.select({
			id: backups.id,
			status: backups.status,
			trigger: backups.trigger,
			filename: backups.filename,
			size: backups.size,
			error: backups.error,
			createdAt: backups.createdAt,
			completedAt: backups.completedAt,
		})
		.from(backups)
		.where(eq(backups.createdByUserId, userId))
		.orderBy(desc(backups.createdAt));
	return rows;
}

export async function startBackupForUser(env: CloudflareEnv, userId: string): Promise<string> {
	const backupId = await createBackupRecord(env, "manual", userId);
	try {
		await getBackupWorkflowBinding(env).create({
			id: `database-backup-${backupId}`,
			params: { backupId, force: true },
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to start backup";
		await getDb(env)
			.update(backups)
			.set({ status: "failed", error: message, completedAt: new Date() })
			.where(eq(backups.id, backupId));
		throw error;
	}
	return backupId;
}

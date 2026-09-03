import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { backups } from "@/db/schema";
import { exportDatabaseRecords } from "./export";
import { createScheduledBackupIfDue, getBackupSettings } from "./service";
import type { BackupWorkflowParams } from "./types";
import { BACKUP_PREFIX, createBackupFilename } from "./utils";

export class DatabaseBackupWorkflow extends WorkflowEntrypoint<
  CloudflareEnv,
  BackupWorkflowParams
> {
  async run(event: Readonly<WorkflowEvent<BackupWorkflowParams>>, step: WorkflowStep) {
    let backupId = event.payload?.backupId;
    if (!backupId) {
      const scheduledBackupId = await step.do("Check backup schedule", async () =>
        createScheduledBackupIfDue(this.env, event.timestamp),
      );
      backupId = scheduledBackupId ?? undefined;
    }
    if (!backupId) {
      const retention = await step.do("Delete expired backups", async () =>
        this.deleteExpiredBackups(),
      );
      return { skipped: true, ...retention };
    }

    try {
      await step.do("Mark backup running", async () => {
        await getDb(this.env)
          .update(backups)
          .set({ status: "running", startedAt: new Date() })
          .where(eq(backups.id, backupId));
      });

      const stored = await step.do("Store backup in R2", async () => {
        const content = await exportDatabaseRecords(this.env.DB);
        const filename = createBackupFilename(new Date());
        const r2Key = `${BACKUP_PREFIX}/${backupId}/${filename}`;
        const object = await this.env.BUCKET.put(r2Key, content, {
          httpMetadata: { contentType: "application/json" },
          customMetadata: { backupId },
        });
        return { filename, r2Key, size: object.size };
      });

      await step.do("Complete backup", async () => {
        await getDb(this.env)
          .update(backups)
          .set({
            status: "completed",
            filename: stored.filename,
            r2Key: stored.r2Key,
            size: stored.size,
            completedAt: new Date(),
            error: sql`NULL`,
          })
          .where(eq(backups.id, backupId));
      });

      await step.do("Delete expired backups", async () => this.deleteExpiredBackups());
      return { backupId, ...stored };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Backup failed";
      await getDb(this.env)
        .update(backups)
        .set({ status: "failed", error: message, completedAt: new Date() })
        .where(eq(backups.id, backupId));
      throw error;
    }
  }

  private async deleteExpiredBackups(): Promise<{ deleted: number }> {
    const settings = await getBackupSettings(this.env);
    if (!settings?.retentionEnabled) return { deleted: 0 };
    const cutoff = new Date(Date.now() - settings.retentionDays * 86_400_000);
    const db = getDb(this.env);
    const expired = await db
      .select()
      .from(backups)
      .where(and(lt(backups.createdAt, cutoff), inArray(backups.status, ["completed", "failed"])));
    for (const backup of expired) {
      if (backup.r2Key) await this.env.BUCKET.delete(backup.r2Key);
      await db.delete(backups).where(eq(backups.id, backup.id));
    }
    return { deleted: expired.length };
  }
}

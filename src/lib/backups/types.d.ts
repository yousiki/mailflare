export type BackupScheduleType = "daily" | "weekly" | "monthly";

export type BackupWorkflowParams = {
	backupId?: string;
	force?: boolean;
};

export type BackupWorkflowBinding = {
	create(options?: {
		id?: string;
		params?: BackupWorkflowParams;
	}): Promise<unknown>;
};

export type DatabaseBackupTable = "users" | "domains" | "mailboxes" | "mailbox_access" | "contacts" | "folders" | "api_keys" | "messages" | "message_attachments" | "outbound_jobs" | "routing_rules" | "webhooks" | "webhook_deliveries" | "sessions" | "audit_logs" | "backup_settings" | "backups" | "app_settings" | "license_settings" | "email_templates" | "calendar_events" | "auto_reply_deliveries";
export type DatabaseRecord = Record<string, string | number | null>;
export type DatabaseBackupDocument = { format: "mailflare-database-backup"; version: 1; createdAt: string; tables: Record<DatabaseBackupTable, DatabaseRecord[]>; };

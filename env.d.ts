interface CloudflareEnv {
	DB: D1Database;
	EMAIL: SendEmail;
	BUCKET: R2Bucket;
	INBOUND_QUEUE: Queue<import("./src/lib/email/inbound").InboundQueueMessage>;
	OUTBOUND_QUEUE: Queue<import("./src/lib/email/send").OutboundQueueMessage>;
	ASSETS: Fetcher;
	IMAGES: ImagesBinding;
	WORKER_SELF_REFERENCE: Fetcher;
	REALTIME: DurableObjectNamespace<
		import("./src/lib/realtime/hub").RealtimeHub
	>;
	DATABASE_BACKUP_WORKFLOW?: Workflow<import("./src/lib/backups/types").BackupWorkflowParams>;
	LOGIN_RATE_LIMIT?: RateLimit;
	CF_TOKEN?: string;
	CF_API_KEY?: string;
	CF_EMAIL?: string;
	CF_AID?: string;
	D1_DATABASE_ID?: string;
	D1_BACKUP_TOKEN?: string;
	TURNSTILE_SECRET_KEY?: string;
	GITHUB_UPDATE_TOKEN?: string;
	GITHUB_UPDATE_REF?: string;
	GITHUB_UPDATE_REPO?: string
}

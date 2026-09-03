const MIGRATION_NAMES = [
	"0000_flowery_smasher.sql",
	"0001_add_reset_email.sql",
	"0002_add_message_read.sql",
	"0003_add_contacts.sql",
	"0004_add_accounts.sql",
	"0005_add_folders.sql",
	"0006_add_rule_conditions.sql",
	"0007_add_shared_mailboxes.sql",
	"0008_add_message_attachments.sql",
	"0009_add_backups.sql",
	"0010_hard_squirrel_girl.sql",
	"0011_add_folder_colors.sql",
	"0012_add_app_settings.sql",
	"0013_add_license_settings.sql",
	"0014_add_account_permissions.sql",
	"0015_add_forwarding_email.sql",
	"0016_add_message_snooze.sql",
	"0017_add_message_star.sql",
	"0018_add_mailbox_domain_aliases.sql",
	"0019_merge_message_bodies.sql",
	"0020_add_calendar_templates_schedule.sql",
	"0021_add_mailbox_signature.sql",
	"0022_add_mailbox_auto_reply.sql",
];

const INITIAL_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (id text PRIMARY KEY NOT NULL, email text NOT NULL UNIQUE, reset_email text, forwarding_email text, password_hash text NOT NULL, name text NOT NULL, avatar_key text, role text DEFAULT 'user' NOT NULL, disabled integer DEFAULT false NOT NULL, can_manage_mailboxes integer DEFAULT false NOT NULL, created_by_user_id text REFERENCES users(id) ON DELETE set null, created_at integer NOT NULL);
CREATE INDEX IF NOT EXISTS users_created_by_idx ON users(created_by_user_id);
CREATE TABLE IF NOT EXISTS domains (id text PRIMARY KEY NOT NULL, user_id text NOT NULL REFERENCES users(id) ON DELETE cascade, hostname text NOT NULL, zone_id text NOT NULL, status text DEFAULT 'pending' NOT NULL, routing_status text, sending_subdomain_tag text, sending_enabled integer DEFAULT false NOT NULL, routing_enabled integer DEFAULT false NOT NULL, created_at integer NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS domains_hostname_idx ON domains(hostname);
CREATE INDEX IF NOT EXISTS domains_user_idx ON domains(user_id);
CREATE TABLE IF NOT EXISTS mailboxes (id text PRIMARY KEY NOT NULL, user_id text NOT NULL REFERENCES users(id) ON DELETE cascade, domain_id text NOT NULL REFERENCES domains(id) ON DELETE cascade, local_part text NOT NULL, display_name text, signature text, auto_reply_enabled integer DEFAULT false NOT NULL, auto_reply_subject text DEFAULT 'Out of office' NOT NULL, auto_reply_body text DEFAULT '' NOT NULL, avatar_key text, type text DEFAULT 'personal' NOT NULL, use_all_domains integer DEFAULT true NOT NULL, disabled integer DEFAULT false NOT NULL, created_at integer NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS mailboxes_address_idx ON mailboxes(domain_id, local_part);
CREATE TABLE IF NOT EXISTS auto_reply_deliveries (id text PRIMARY KEY NOT NULL, mailbox_id text NOT NULL REFERENCES mailboxes(id) ON DELETE cascade, recipient text NOT NULL, sent_at integer NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS auto_reply_deliveries_mailbox_recipient_idx ON auto_reply_deliveries(mailbox_id, recipient);
CREATE INDEX IF NOT EXISTS auto_reply_deliveries_sent_idx ON auto_reply_deliveries(sent_at);
CREATE TABLE IF NOT EXISTS mailbox_access (id text PRIMARY KEY NOT NULL, mailbox_id text NOT NULL REFERENCES mailboxes(id) ON DELETE cascade, user_id text NOT NULL REFERENCES users(id) ON DELETE cascade, permission text DEFAULT 'read_only' NOT NULL, created_by_user_id text REFERENCES users(id) ON DELETE set null, created_at integer NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS mailbox_access_mailbox_user_idx ON mailbox_access(mailbox_id, user_id);
CREATE INDEX IF NOT EXISTS mailbox_access_user_idx ON mailbox_access(user_id);
CREATE INDEX IF NOT EXISTS mailbox_access_mailbox_idx ON mailbox_access(mailbox_id);
CREATE TABLE IF NOT EXISTS contacts (id text PRIMARY KEY NOT NULL, user_id text NOT NULL REFERENCES users(id) ON DELETE cascade, email text NOT NULL, display_name text, source text DEFAULT 'inbound' NOT NULL, blocked integer DEFAULT false NOT NULL, last_seen_at integer, created_at integer NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS contacts_user_email_idx ON contacts(user_id, email);
CREATE INDEX IF NOT EXISTS contacts_user_idx ON contacts(user_id);
CREATE TABLE IF NOT EXISTS folders (id text PRIMARY KEY NOT NULL, user_id text NOT NULL REFERENCES users(id) ON DELETE cascade, mailbox_id text NOT NULL REFERENCES mailboxes(id) ON DELETE cascade, name text NOT NULL, color text DEFAULT '#2563eb' NOT NULL, created_at integer NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS folders_mailbox_name_idx ON folders(mailbox_id, name);
CREATE INDEX IF NOT EXISTS folders_user_idx ON folders(user_id);
CREATE INDEX IF NOT EXISTS folders_mailbox_idx ON folders(mailbox_id);
CREATE TABLE IF NOT EXISTS api_keys (id text PRIMARY KEY NOT NULL, user_id text NOT NULL REFERENCES users(id) ON DELETE cascade, name text NOT NULL, prefix text NOT NULL, key_hash text NOT NULL, scopes text NOT NULL, created_at integer NOT NULL, last_used_at integer);
CREATE TABLE IF NOT EXISTS messages (id text PRIMARY KEY NOT NULL, user_id text NOT NULL REFERENCES users(id) ON DELETE cascade, mailbox_id text REFERENCES mailboxes(id) ON DELETE set null, direction text NOT NULL, provider_message_id text, folder_id text REFERENCES folders(id) ON DELETE set null, from_addr text NOT NULL, to_addr text NOT NULL, subject text, snippet text, text_body text, html_body text, raw_r2_key text, status text DEFAULT 'received' NOT NULL, read integer DEFAULT false NOT NULL, starred integer DEFAULT false NOT NULL, snoozed_until integer, thread_id text, created_at integer NOT NULL);
CREATE INDEX IF NOT EXISTS messages_user_created_idx ON messages(user_id, created_at);
CREATE INDEX IF NOT EXISTS messages_mailbox_idx ON messages(mailbox_id);
CREATE INDEX IF NOT EXISTS messages_folder_idx ON messages(folder_id);
CREATE TABLE IF NOT EXISTS message_attachments (id text PRIMARY KEY NOT NULL, message_id text NOT NULL REFERENCES messages(id) ON DELETE cascade, filename text NOT NULL, content_type text NOT NULL, size integer NOT NULL, disposition text DEFAULT 'attachment' NOT NULL, content_id text, r2_key text NOT NULL UNIQUE, created_at integer NOT NULL);
CREATE INDEX IF NOT EXISTS message_attachments_message_idx ON message_attachments(message_id);
CREATE TABLE IF NOT EXISTS outbound_jobs (id text PRIMARY KEY NOT NULL, user_id text NOT NULL REFERENCES users(id) ON DELETE cascade, message_id text REFERENCES messages(id) ON DELETE set null, status text DEFAULT 'queued' NOT NULL, payload text NOT NULL, error text, scheduled_at integer, created_at integer NOT NULL, updated_at integer NOT NULL);
CREATE TABLE IF NOT EXISTS email_templates (id text PRIMARY KEY NOT NULL, user_id text NOT NULL REFERENCES users(id) ON DELETE cascade, name text NOT NULL, subject text DEFAULT '' NOT NULL, text_body text DEFAULT '' NOT NULL, created_at integer NOT NULL, updated_at integer NOT NULL);
CREATE INDEX IF NOT EXISTS email_templates_user_idx ON email_templates(user_id);
CREATE TABLE IF NOT EXISTS calendar_events (id text PRIMARY KEY NOT NULL, user_id text NOT NULL REFERENCES users(id) ON DELETE cascade, mailbox_id text REFERENCES mailboxes(id) ON DELETE set null, title text NOT NULL, description text DEFAULT '' NOT NULL, location text DEFAULT '' NOT NULL, attendees text DEFAULT '[]' NOT NULL, starts_at integer NOT NULL, ends_at integer NOT NULL, created_at integer NOT NULL, updated_at integer NOT NULL);
CREATE INDEX IF NOT EXISTS calendar_events_user_starts_idx ON calendar_events(user_id, starts_at);
CREATE TABLE IF NOT EXISTS routing_rules (id text PRIMARY KEY NOT NULL, user_id text NOT NULL REFERENCES users(id) ON DELETE cascade, domain_id text NOT NULL REFERENCES domains(id) ON DELETE cascade, pattern text NOT NULL, match_field text DEFAULT 'email' NOT NULL, match_operator text DEFAULT 'contains' NOT NULL, match_value text DEFAULT '' NOT NULL, mailbox_id text REFERENCES mailboxes(id) ON DELETE set null, folder_id text REFERENCES folders(id) ON DELETE set null, action text DEFAULT 'store' NOT NULL, forward_to text, priority integer DEFAULT 0 NOT NULL, created_at integer NOT NULL);
CREATE TABLE IF NOT EXISTS webhooks (id text PRIMARY KEY NOT NULL, user_id text NOT NULL REFERENCES users(id) ON DELETE cascade, url text NOT NULL, secret text NOT NULL, events text NOT NULL, enabled integer DEFAULT true NOT NULL, created_at integer NOT NULL);
CREATE TABLE IF NOT EXISTS webhook_deliveries (id text PRIMARY KEY NOT NULL, webhook_id text NOT NULL REFERENCES webhooks(id) ON DELETE cascade, event_type text NOT NULL, payload text NOT NULL, status text DEFAULT 'pending' NOT NULL, attempts integer DEFAULT 0 NOT NULL, created_at integer NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (id text PRIMARY KEY NOT NULL, user_id text NOT NULL REFERENCES users(id) ON DELETE cascade, token_hash text NOT NULL UNIQUE, expires_at integer NOT NULL, created_at integer NOT NULL);
CREATE TABLE IF NOT EXISTS audit_logs (id text PRIMARY KEY NOT NULL, actor_user_id text REFERENCES users(id) ON DELETE set null, target_user_id text REFERENCES users(id) ON DELETE set null, mailbox_id text REFERENCES mailboxes(id) ON DELETE set null, message_id text REFERENCES messages(id) ON DELETE set null, action text NOT NULL, metadata text, created_at integer NOT NULL);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS audit_logs_mailbox_idx ON audit_logs(mailbox_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at);
CREATE TABLE IF NOT EXISTS backup_settings (id text PRIMARY KEY NOT NULL, enabled integer DEFAULT false NOT NULL, schedule_type text DEFAULT 'daily' NOT NULL, schedule_value integer, retention_enabled integer DEFAULT false NOT NULL, retention_days integer DEFAULT 30 NOT NULL, updated_at integer NOT NULL);
INSERT OR IGNORE INTO backup_settings (id, enabled, schedule_type, retention_enabled, retention_days, updated_at) VALUES ('default', false, 'daily', false, 30, unixepoch());
CREATE TABLE IF NOT EXISTS backups (id text PRIMARY KEY NOT NULL, status text DEFAULT 'queued' NOT NULL, trigger text NOT NULL, r2_key text, filename text, size integer, error text, created_by_user_id text REFERENCES users(id) ON DELETE set null, created_at integer NOT NULL, started_at integer, completed_at integer);
CREATE INDEX IF NOT EXISTS backups_created_idx ON backups(created_at);
CREATE INDEX IF NOT EXISTS backups_status_idx ON backups(status);
CREATE TABLE IF NOT EXISTS app_settings (id text PRIMARY KEY NOT NULL, app_name text DEFAULT 'Mailflare' NOT NULL, icon_key text, updated_at integer NOT NULL);
INSERT OR IGNORE INTO app_settings (id, app_name, updated_at) VALUES ('default', 'Mailflare', unixepoch());
CREATE TABLE IF NOT EXISTS license_settings (id text PRIMARY KEY NOT NULL, instance_id text NOT NULL, instance_url text, license_key_hash text, plan text DEFAULT 'community' NOT NULL, state text DEFAULT 'inactive' NOT NULL, features text DEFAULT '[]' NOT NULL, activated_at integer, validated_at integer, updated_at integer NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS license_settings_instance_id_unique ON license_settings(instance_id);
CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL);
`;

export async function migrateCleanDatabase(db: D1Database): Promise<boolean> {
	const existing = await db
		.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT IN ('d1_migrations', 'd1_kv')")
		.all<{ name: string }>();
	if (existing.results.length > 0) {
		const tableNames = new Set(existing.results.map((table) => table.name));
		if (tableNames.has("users") && tableNames.has("domains")) return false;
		throw new Error(
			"The D1 database is not empty, but the Mailflare schema is incomplete. Apply the committed D1 migrations before continuing setup.",
		);
	}

	const schemaStatements = INITIAL_SCHEMA_SQL
		.split(";")
		.map((statement) => statement.trim())
		.filter(Boolean)
		.map((statement) => db.prepare(statement));
	const migrationStatements = MIGRATION_NAMES.map((name) =>
		db.prepare("INSERT OR IGNORE INTO d1_migrations (name) VALUES (?)").bind(name),
	);
	await db.batch([...schemaStatements, ...migrationStatements]);
	return true;
}

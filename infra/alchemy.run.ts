import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import * as Redacted from "effect/Redacted";

const domain = process.env.MAILFLARE_DOMAIN;
if (!domain && process.env.ALCHEMY_STAGE === "production") {
  throw new Error("MAILFLARE_DOMAIN is required for the production stage");
}

export default Alchemy.Stack(
  "Mailflare",
  { providers: Cloudflare.providers(), state: Alchemy.localState() },
  Effect.gen(function*() {
    const database = yield* Cloudflare.D1.Database("MailflareDatabase", {
      name: "mailflare",
      migrations: "drizzle/migrations",
      jurisdiction: "default",
    });
    const rawMail = yield* Cloudflare.R2.Bucket("MailflareRawMail", {
      name: "mailflare-raw",
      forceDestroy: false,
    });
    const inboundQueue = yield* Cloudflare.Queues.Queue("MailflareInboundQueue", {
      name: "mailflare-inbound",
    });
    const outboundQueue = yield* Cloudflare.Queues.Queue("MailflareOutboundQueue", {
      name: "mailflare-outbound",
    });
    const worker = yield* Cloudflare.Worker("MailflareWorker", {
      name: "mailflare",
      main: "./apps/mailflare/worker.ts",
      assets: { directory: "./apps/mailflare/dist/client" },
      domain,
      compatibility: {
        date: "2026-05-20",
        flags: ["nodejs_compat", "global_fetch_strictly_public"],
      },
      env: {
        DB: database,
        BUCKET: rawMail,
        INBOUND_QUEUE: inboundQueue,
        OUTBOUND_QUEUE: outboundQueue,
        REALTIME: Cloudflare.DurableObject("RealtimeHub", { className: "RealtimeHub" }),
        DATABASE_BACKUP_WORKFLOW: Cloudflare.Workflow("DatabaseBackupWorkflow", {
          className: "DatabaseBackupWorkflow",
        }),
        EMAIL: Cloudflare.Email.SendEmail("EMAIL"),
        LOGIN_RATE_LIMIT: Cloudflare.RateLimit("LOGIN_RATE_LIMIT", {
          namespaceId: 1001,
          simple: { limit: 20, period: 60 },
        }),
        CF_EMAIL_WORKER_NAME: "mailflare",
        CF_TOKEN: Redacted.make(process.env.CF_TOKEN ?? ""),
        CF_AID: Redacted.make(process.env.CF_AID ?? ""),
        D1_BACKUP_TOKEN: Redacted.make(process.env.D1_BACKUP_TOKEN ?? ""),
        TURNSTILE_SECRET_KEY: Redacted.make(process.env.TURNSTILE_SECRET_KEY ?? ""),
        GITHUB_UPDATE_TOKEN: Redacted.make(process.env.GITHUB_UPDATE_TOKEN ?? ""),
      },
      observability: { enabled: true },
    });

    return {
      url: worker.url,
      databaseId: database.databaseId,
      rawMailBucket: rawMail.bucketName,
      inboundQueue: inboundQueue.queueName,
      outboundQueue: outboundQueue.queueName,
    };
  }),
);

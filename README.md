<img src="/public/icon-96.png" alt="Mailflare" width="72" />

# Mailflare

Mailflare is a self-hosted email inbox for custom domains, built on Cloudflare.

This repository is a self-hosted fork of [upstream Mailflare](https://github.com/hieunc229/mailflare). In self-hosted mode, the functionality already present in this repository is enabled by default, including custom branding, account management, email forwarding, shared mailboxes, and delegated mailbox access. This is a property of this fork and does not represent or grant an upstream commercial Pro or Team license.

Upstream attribution is retained. “Mailflare” and related names, logos, and trademarks belong to their respective owners; this fork is independent and is not affiliated with or endorsed by upstream.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/hieunc229/mailflare)

![Mailflare inbox](/screenshot.png)

Thanks to mailflare sponsors. Want to support the project? Drop [@hieuSSR](https://x.com/hieuSSR) a message

### Featured sponsors

<a target="_blank" href="https://sequenzy.com/?ref=hieunc229/mailflare">
  <img width="160" src="/sponsors/sequenzy.png" alt="Sequenzy">
</a>

## What you can do

- Connect domains and set up Cloudflare Email Routing from the dashboard.
- Create personal and shared mailboxes with delegated access.
- Send and receive email with attachments, rich formatting, signatures, and automatic replies.
- Organize mail with search, custom folders, stars, snoozing, archive, spam, and trash.
- Create routing rules to store, forward, reject, or categorize incoming messages.
- Get real-time inbox updates and new-message notifications.
- Import and export mail, manage contacts, and block unwanted senders.
- Manage accounts, permissions, API keys, webhooks, audit logs, and database backups.

## How it works

Mailflare runs in your Cloudflare account. Email Routing delivers incoming messages to the app, while Cloudflare's email service handles outgoing messages. Your mail data stays in your own D1 database and attachments are stored in your own R2 bucket.

## How much does it cost?

You can setup Mailflare and receive email for free

A [Paid Worker](https://developers.cloudflare.com/workers/platform/pricing/) plan ($5/month) is required to send email (and it's recommend to have a smooth experience)

| Action                               | Cloudflare API                                           |
| ------------------------------------ | -------------------------------------------------------- |
| List DNS / status                    | `GET /zones/{zone_id}/email/routing/dns`                 |
| Enable inbound routing + MX/SPF/DKIM | `POST /zones/{zone_id}/email/routing/dns`                |
| Disable routing                      | `DELETE /zones/{zone_id}/email/routing/dns`              |
| Enable subdomain sending + DNS       | `POST /zones/{zone_id}/email/sending/subdomains`         |
| Remove subdomain sending             | `DELETE /zones/{zone_id}/email/sending/subdomains/{tag}` |
| Subdomain sending DNS records        | `GET .../subdomains/{tag}/dns`                           |

## Deploy

Getting started takes three steps:

1. **Deploy the app.** Click **Deploy to Cloudflare** and keep the app name as `mailflare`. The app will not work correctly under another Worker name.
2. **Complete setup.** Open the deployed app and follow `/setup` to check the installation and create your admin account.
3. **Connect your domain.** Add a domain managed by the same Cloudflare account. Mailflare configures its email routing and helps you create the first mailbox.

`CF_TOKEN` is required during deployment. Use a scoped Cloudflare API token with **Zone Read**, **Email Routing Edit**, **Email Sending Edit**, and **Email Routing Rules Write** permissions for the domains you want to connect. This runtime token is separate from the token Cloudflare uses to deploy the app.

See the [deployment guide](docs/deployment.md) for required permissions, manual deployment, backups, and updates.

## Local development

```bash
cp .dev.vars.example .dev.vars
npm install
npm run db:migrate:local
npm run dev
```

Add your Cloudflare credentials to `.dev.vars`, then open [http://localhost:3000](http://localhost:3000). For sample local data, run `npm run db:seed` while the development server is running.

## Documentation

- [Deployment and configuration](docs/deployment.md)
- [API and integrations](docs/api.md)
- [Troubleshooting](docs/troubleshooting.md)

## License and upstream attribution

The source code in this repository is released under the GNU Affero General Public License v3.0 (AGPLv3). See [LICENSE](LICENSE) for the complete license text. Self-hosted use does not require a commercial license key or online activation service and does not depend on Paymug.

Received MIME attachments are extracted automatically. Downloads require access to the mailbox
containing the message.

### Real-time email notifications

Mailflare uses a Cloudflare Durable Object WebSocket hub to notify connected users immediately after
an inbound message is stored. The inbox and unread counts refresh without waiting for polling, and
an in-app popup links directly to the new message. Mailbox owners, the domain admin, and delegated
users receive events for mailboxes they can access.

The `RealtimeHub` Durable Object and `DatabaseBackupWorkflow` bindings are declared in
`infra/alchemy.run.ts` and provisioned with the Worker.
When the socket is temporarily unavailable, the client retries automatically and uses a slower
fallback refresh until the connection recovers.

Complete first-run configuration at `/setup`, or seed dev data. The first setup step checks the
required Cloudflare runtime configuration and initializes the schema when the bound D1 database is
empty. Existing databases are never migrated by the setup page; apply later migrations with the
normal Wrangler migration command.

```bash
curl -X POST http://localhost:3000/api/seed
```

## Deploy

Mailflare is a TanStack Start application running in a Cloudflare Worker. Vite builds the
SSR Worker and browser assets; Hono and oRPC provide the typed application gateway. Cloudflare
resources are declared in `infra/alchemy.run.ts`, not in a production-generated Wrangler file.

### GitHub Actions deployment

`.github/workflows/deploy.yml` runs verification before deployment:

1. Installs the frozen Bun workspace lockfile.
2. Runs the modern app typecheck, oxlint, formatter check, and Vitest suite.
3. Builds the TanStack Start Worker with the Cloudflare Vite plugin.
4. Optionally purges only exact existing Mailflare resource names when the manually-triggered
   `purge_existing` input is enabled.
5. Plans and deploys `infra/alchemy.run.ts` to the `production` stage.
6. Checks `/`, `/login`, `/register`, `/setup`, `/inbox`, `/settings`, and `/admin` on the
   configured public domain and requires a `Mailflare` page marker.

The production hostname is never committed. Set the GitHub Actions `production` Environment
variable `MAILFLARE_DOMAIN` to the desired hostname. The Alchemy stack uses that value for the
Worker custom domain and does not declare or modify any other Worker in the account.

### GitHub Actions configuration

Configure the `production` Environment with:

- Variable `MAILFLARE_DOMAIN` — the public custom domain.
- Optional variable `CF_EMAIL_WORKER_NAME` — must remain `mailflare`.
- Optional variable `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.

Configure these secrets:

- `CLOUDFLARE_ACCOUNT_ID` — target Cloudflare account ID.
- `CLOUDFLARE_API_TOKEN` — Alchemy deployment token.
- `CF_TOKEN` — runtime Cloudflare API token used by Mailflare domain and email operations.
- `CF_AID` — account ID used by database backup operations.
- Any existing runtime secrets required by the installed features, such as
  `D1_BACKUP_TOKEN`, `TURNSTILE_SECRET_KEY`, `GITHUB_UPDATE_TOKEN`, `CF_EMAIL`, and `CF_API_KEY`.

Secrets are supplied to CI and runtime bindings without printing their values or committing them.

### Fresh installation and resource ownership

The Alchemy stack owns only these explicitly named resources:

- Worker: `mailflare`
- D1 database: `mailflare`
- R2 bucket: `mailflare-raw`
- Queues: `mailflare-inbound` and `mailflare-outbound`
- Durable Object and Workflow bindings declared by the Worker

The workflow does not purge these resources on ordinary pushes. To perform the issue #2 fresh
installation, manually dispatch the workflow with `purge_existing` enabled after reviewing the
exact resource names in the Cloudflare account. The purge step never uses a prefix or wildcard and
does not target unrelated Workers, domains, DNS records, mailboxes, or account resources.

The fresh D1 schema includes Better Auth's `user`, `session`, `account`, and `verification` tables.
Existing Mailflare users, passwords, sessions, and business data are intentionally not migrated.
Complete `/setup` after the first successful deployment to create a new administrator.

### Manual local deployment

Build the application and run the same Alchemy stack locally with credentials supplied through the
environment or an untracked `.env` file:

```bash
bun install --frozen-lockfile
bun run --cwd apps/mailflare build
bunx alchemy plan infra/alchemy.run.ts --stage staging
bunx alchemy deploy infra/alchemy.run.ts --stage staging
```

Use GitHub Actions for production so the hostname, account ID, deployment token, and runtime
secrets remain in the protected `production` Environment.

## Troubleshooting

### Cloudflare API 403 ... code 9109: Invalid access token

**Resolution:** The Deploy to Cloudflare flow can authenticate and deploy the Worker, but it does not create a runtime `CF_TOKEN` for Mailflare's onboarding API calls. Create `CF_TOKEN` manually from Cloudflare dashboard user API tokens and enter it as a deploy secret/variable.

Verify the token:

```bash
curl "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer <CF_TOKEN>"
```

The response should include `"success": true` and `"status": "active"`. In `.dev.vars` or deploy settings, set `CF_TOKEN` to the token secret value only. Do not include the word `Bearer`, do not use the token ID, and do not put a Global API Key in `CF_TOKEN`. For a Global API Key, set both `CF_EMAIL` and `CF_API_KEY` instead.

Also check whether the token has an expiration, a `not_before` time, or client IP restrictions. If you changed deploy variables in Cloudflare, redeploy so the Worker receives the new values.

#### Cloudflare API 403 on /zones/{zone_id}/email/routing/dns: code 10000

This error indicate API Key is missing some permissions. Update `CF_TOKEN` minimum permissiongs

For Account: Email Sending:Edit, DNS Settings:Edit, Email Routing Addresses:Edit
For Zone: DNS Settings:Edit, Email Routing Rules:Edit, Zone Settings:Edit, DNS:Edit

### Manual deploy

For a staging deployment, provide the same non-secret variables and protected secrets used by the
GitHub Actions `production` Environment, then run:

```bash
bun install --frozen-lockfile
bun run --cwd apps/mailflare build
bunx alchemy plan infra/alchemy.run.ts --stage staging
bunx alchemy deploy infra/alchemy.run.ts --stage staging --yes
```

### Cloudflare API authentication errors

The deployment token (`CLOUDFLARE_API_TOKEN`) is used only by CI and Alchemy. The runtime
`CF_TOKEN` is a separate secret used when Mailflare provisions a user's domain and Email Routing.
Do not put `Bearer` in the secret value, and do not commit either token.

The runtime token needs account permissions for Email Sending and Email Routing, plus the zone
permissions required for DNS and routing changes. If an API call returns `401`, `403`, or code
`10000`, verify the token's account, scopes, expiry, and IP restrictions in Cloudflare. Then rerun
the deployment so updated runtime secrets are bound to the Worker.

### D1 migration errors

Alchemy owns the migrations in `drizzle/alchemy-migrations`. The legacy Drizzle migration directory
is retained for reference and is not used by the Alchemy stack. Do not point Alchemy at
`drizzle/migrations/meta/_journal.json`; that is the pre-v1 Drizzle layout.

The issue #2 installation intentionally creates a fresh D1 database. Existing users, sessions,
passwords, and business data are not migrated.

See [LICENSE](LICENSE).

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

The `REALTIME` Durable Object binding and its initial migration are declared in `wrangler.jsonc`.
Deploy with the GitHub Actions workflow so the Durable Object class is provisioned.
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

Mailflare is deployed as a Cloudflare Worker. This repository does not use Cloudflare
Workers Builds or a Cloudflare Pages project. GitHub Actions builds OpenNext and deploys
the Worker with Wrangler.

### GitHub Actions deployment

The workflow in `.github/workflows/deploy.yml` runs on pushes to `main` and can also be
started manually. It performs these steps in order:

1. Installs the locked npm dependencies.
2. Builds the OpenNext Worker.
3. Applies pending remote D1 migrations.
4. Deploys `mailflare` and attaches the configured custom domain.

The hostname is intentionally not stored in `wrangler.jsonc`. Set it as the GitHub Actions
variable `MAILFLARE_DOMAIN`, for example `mail.siki.moe`. The workflow passes it to Wrangler
with `--domain` during deployment. This keeps the public repository independent of one
installation's hostname while still configuring the Custom Domain declaratively in CI.

The existing `siki.moe` and `zotero-mcp.siki.moe` Workers are not changed. Use a free
hostname such as `mail.siki.moe` unless you intentionally want Mailflare to replace the
Worker currently serving the apex `siki.moe`.

### GitHub Actions configuration

Create a GitHub Actions environment named `production`, restrict it to the deployment
branch, and configure the workflow to use that environment. The workflow expects these
environment variables:

- `MAILFLARE_DOMAIN` — public Custom Domain, such as `mail.siki.moe`.
- `CF_EMAIL_WORKER_NAME` — optional variable; defaults to `mailflare` and must match the
deployed Worker script name.
- `GITHUB_UPDATE_REF` — optional branch for the dashboard update workflow.
- `GITHUB_UPDATE_REPO` — optional installation repository in `owner/repository` format.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — optional public Turnstile site key.

Configure these GitHub Actions secrets:

- `CLOUDFLARE_ACCOUNT_ID` — the YouSiki account ID.
- `CLOUDFLARE_API_TOKEN` — CI token allowed to deploy Workers and manage the declared
Worker resources.
- `D1_DATABASE_ID` — the account-specific ID of the `mailflare` D1 database.
- `CF_TOKEN` — separate runtime token used by Mailflare's domain and Email Routing API
calls. It needs the permissions described in the setup section.
- `CF_AID` — account ID used by the backup workflow.
- `D1_BACKUP_TOKEN` — optional token allowed to export the D1 database.
- `TURNSTILE_SECRET_KEY` — optional Turnstile server secret.
- `GITHUB_UPDATE_TOKEN` — optional GitHub token with Actions write permission for the
dashboard update button.
- `CF_EMAIL` and `CF_API_KEY` — optional legacy Global API Key credentials; use these only
instead of `CF_TOKEN`.

The deployment workflow creates temporary production Wrangler and secret files on the
GitHub runner. They are deleted after deployment. Do not commit either file or any of the
secret values.

### First deployment

The account currently has no Mailflare resources. The first deployment must provision or
create the following resources:

- Worker: `mailflare`
- D1 database: `mailflare`
- R2 bucket: `mailflare-raw`
- Queues: `mailflare-inbound` and `mailflare-outbound`
- Durable Object: `RealtimeHub`
- Workflow: `mailflare-database-backup`

If `D1_DATABASE_ID` is already configured, the workflow uses it. Otherwise, it looks up the
`mailflare` database and creates it with Wrangler when necessary. The resolved ID is injected
into temporary files on the GitHub runner and is not committed to this repository.

After deployment, visit `/setup`, create the first administrator, and add the domains that
Mailflare should manage. `CF_EMAIL_WORKER_NAME` must remain `mailflare`; it is the Worker
script name used by Email Routing, not the HTTP hostname.

### Runtime application configuration

`CF_TOKEN` is not the same as `CLOUDFLARE_API_TOKEN`. The former is available to the
deployed application and is used when users add or remove domains. The latter exists only
on the GitHub runner and is used to build, migrate, and deploy the Worker.

The `REALTIME` Durable Object binding and its migration are declared in `wrangler.jsonc`.
The `DATABASE_BACKUP_WORKFLOW` binding is also declared there. Deploy the complete Worker
through this workflow so those bindings are provisioned; a source-only or Pages deployment
does not provide them.

### Dashboard updates

The admin overview can dispatch `.github/workflows/deploy-update.yml`. That workflow merges
upstream source changes and pushes them to the installation branch. The push then triggers
`.github/workflows/deploy.yml`, which builds and deploys the updated Worker.

### Manual local deployment

For an already bootstrapped account, authenticate Wrangler locally and run:

```bash
npx opennextjs-cloudflare build
npx wrangler d1 migrations apply DB --remote
OPEN_NEXT_DEPLOY=true npx wrangler deploy --domain mail.siki.moe
```

Prefer GitHub Actions for production deployment so the hostname, deployment token, runtime
secrets, and account-specific D1 ID remain outside tracked files.

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

For a local deployment, set the same values used by GitHub Actions and run:

```bash
npx opennextjs-cloudflare build
npx wrangler d1 migrations apply DB --remote
OPEN_NEXT_DEPLOY=true npx wrangler deploy --domain "$MAILFLARE_DOMAIN"
```

The deploy script intentionally builds with OpenNext and uploads with Wrangler. Do not replace the
Wrangler step with `opennextjs-cloudflare deploy`: Mailflare's `worker.ts` wrapper exports the
`RealtimeHub` Durable Object and handles email and queue events in addition to the generated Next.js
worker.

Prefer GitHub Actions for production deployment so the hostname, deployment token, runtime secrets,
and account-specific D1 ID remain outside tracked files.

### Cloudflare D1 7404: database could not be found

If automatic deployment fails with:

```text
The database <uuid> could not be found [code: 7404]
```

Remove any committed `database_id` from `wrangler.jsonc`. D1 database IDs are account-specific;
committing one from another account makes Wrangler look up a database that does not exist in the
deploying account. This project declares the `DB` binding with `database_name` only so the resource
can be provisioned for the target account.

The optional `D1_DATABASE_ID` Actions secret can pin an existing database. If it is omitted,
the deployment workflow creates or discovers the `mailflare` D1 database automatically, then
injects the resolved ID into a temporary Wrangler config. Do not commit an account-specific D1
ID to this public repository.

See [LICENSE](LICENSE).

# Deployment and configuration

This guide covers Cloudflare deployment, runtime configuration, database backups, and application updates.

## One-click deployment

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/hieunc229/mailflare)

The deployment flow reads `wrangler.jsonc`, provisions the required Worker bindings, builds the OpenNext Worker, applies D1 migrations, and deploys the app.

Keep `wrangler.jsonc` committed. Do not commit `.dev.vars`; enter secrets during Cloudflare setup or keep them in a local `.dev.vars` file.

## Required configuration

Mailflare needs these runtime values:

- `CF_TOKEN` — a scoped Cloudflare API token with Zone Read, Email Routing Edit, Email Sending Edit, and Email Routing Rules Write access for the domains you will connect. This is separate from the token Cloudflare uses to deploy the app.
- `CF_EMAIL_WORKER_NAME` — the deployed Worker name. It must match the Worker name exactly so Mailflare can create Email Routing rules.
- `CF_AID` — the Cloudflare account ID. This is optional for normal mail use but required for database backups.

You can use a legacy Global API Key instead of `CF_TOKEN` by setting both `CF_API_KEY` and `CF_EMAIL`.

Copy `.dev.vars.example` when configuring a local environment:

```bash
cp .dev.vars.example .dev.vars
```

Paste only the token value into `CF_TOKEN`; do not include `Bearer` and do not use the token ID.

## First-run setup

Open `/setup` after deployment. Mailflare checks the required runtime configuration and initializes an empty D1 database. It never applies later migrations to an existing database from the setup page.

Use the normal migration command when updating an existing installation:

```bash
npm run db:migrate:remote
```

## Manual deployment

Install dependencies, configure the Cloudflare bindings in `wrangler.jsonc`, and run:

```bash
npm install
npm run deploy
```

The deploy command builds the OpenNext application and uploads the complete Worker with Wrangler. The complete Worker is required because `worker.ts` also handles inbound email, queues, workflows, and the real-time Durable Object.

To migrate an existing remote D1 database before deploying, use:

```bash
npm run deploy:with-migrations
```

Remote migrations require the target account's `database_id` in your local `wrangler.jsonc`. Do not commit an account-specific database ID to a reusable repository.

## Custom Worker names

If you rename the Worker, keep these values aligned:

- `name` in `wrangler.jsonc`
- `services[].service` for the `WORKER_SELF_REFERENCE` binding
- `CF_EMAIL_WORKER_NAME`

Cloudflare service bindings use a literal Worker name and cannot inherit the top-level `name` value automatically.

## Database backups

Manual and scheduled backups use the `DATABASE_BACKUP_WORKFLOW` binding declared in `wrangler.jsonc`. Deploy the complete Worker with `npm run deploy` whenever this binding is added or changed.

Backups require:

- `CF_AID`
- `D1_DATABASE_ID`
- `D1_BACKUP_TOKEN`, or a `CF_TOKEN` that is also allowed to export the D1 database

## Updating Mailflare

The **Update Mailflare** button in the admin dashboard dispatches `.github/workflows/update.yml` in the installation repository. The workflow merges the latest upstream source, applies pending D1 migrations, and pushes the updated source. A connected Cloudflare Git integration can then build and deploy the change.

Configure these Worker values:

- `GITHUB_UPDATE_TOKEN` — a fine-grained GitHub token for the installation repository with Actions write permission.
- `GITHUB_UPDATE_REPO` — the installation repository in `owner/repository` format.
- `GITHUB_UPDATE_REF` — an optional update branch. The repository's default branch is used when omitted.

Configure these GitHub Actions repository secrets:

- `CLOUDFLARE_API_TOKEN` — a Cloudflare token allowed to read and migrate D1.
- `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account ID.
- `MAILFLARE_UPSTREAM_TOKEN` — required only when the upstream repository is private.

Optional repository variables:

- `MAILFLARE_UPSTREAM_REPOSITORY` — the upstream repository. Defaults to `hieunc229/mailflare`.
- `MAILFLARE_UPSTREAM_BRANCH` — the upstream branch. Defaults to `main`.

If an older installation contains a failing updater, copy the latest `.github/workflows/update.yml` into that installation once. An updater that cannot read upstream cannot update its own workflow.

## Branding license

Activate a purchased Pro or Team key from **Admin → Licenses**. Mailflare sends the key to Paymug and stores only a one-way hash and the activation state. Apply all D1 migrations before activating a license.

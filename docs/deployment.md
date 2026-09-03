# Deployment and configuration

This guide covers Cloudflare deployment, runtime configuration, database backups, and application updates.

This repository is a self-hosted fork of [upstream Mailflare](https://github.com/hieunc229/mailflare). The functionality already present in this repository is enabled by default for self-hosted deployments, including custom branding, account management, email forwarding, shared mailboxes, and delegated mailbox access. This availability is specific to this fork and does not represent or grant an upstream commercial Pro or Team license.

Upstream attribution is retained. “Mailflare” and related names, logos, and trademarks belong to their respective owners; this fork is independent and is not affiliated with or endorsed by upstream.

## Overview

Set up Mailflare in three steps:

1. **Deploy the app:** use the Deploy to Cloudflare button, set the app name to `mailflare`, and provide the required `CF_TOKEN`.
2. **Complete setup:** open the deployed app and follow `/setup` to check the installation and create the first admin account.
3. **Connect your domain:** add a domain managed by the same Cloudflare account. Mailflare configures email routing and sending, then helps you create the first mailbox.

The Worker name must remain `mailflare`. Before starting, create the required `CF_TOKEN` with **Zone Read**, **Email Routing Edit**, **Email Sending Edit**, and **Email Routing Rules Write** permissions for every domain you plan to connect.

## Step 1: Deploy mailflare

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/hieunc229/mailflare)

1. Click **Deploy to Cloudflare** above and sign in to Cloudflare if prompted.
2. Choose the Cloudflare account that owns the domain you want to use.
3. Set the app name to exactly `mailflare`. Do not rename it.
4. Add `CF_TOKEN` when Cloudflare asks for the app's runtime variables or secrets.
5. Start the deployment and wait for Cloudflare to finish provisioning and deploying the Worker.

### Required configuration

Mailflare requires this runtime value:

- `CF_TOKEN` — a scoped Cloudflare API token with **Zone Read**, **Email Routing Edit**, **Email Sending Edit**, and **Email Routing Rules Write** access for the domains you will connect. This is separate from the token Cloudflare uses to deploy the app.

Paste only the token secret into `CF_TOKEN`. Do not include the word `Bearer` and do not use the token ID. The token must belong to the same Cloudflare account as the domains you connect.

## Step 2: Complete mailflare setup

1. Open the URL of the deployed `mailflare` Worker.
2. Go to `/setup` if Mailflare does not take you there automatically.
3. Let Mailflare check the required Cloudflare configuration and initialize the empty D1 database.
4. Create the first admin account when prompted.

The setup page initializes only a new, empty database. It never applies later migrations to an existing database.

## Step 3: Connect your primary domain and create an account

1. Enter a domain that already uses Cloudflare DNS on the same account as `CF_TOKEN`.
2. Continue while Mailflare enables Email Routing and configures the required routing and sending DNS.
3. Choose the address for your first mailbox and finish setup.
4. Open the inbox and send a test message to the new address.

To connect more domains later, open **Admin → Domains**, select **New domain**, and enter the hostname. Mailflare configures Email Routing and Email Sending automatically.

Your inbox should be ready to send and receive emails

---

## Manual deployment

Install dependencies, configure the Cloudflare bindings in `wrangler.jsonc`, and run:

```bash
npm install
npm run deploy:local
```

The local deploy command builds the OpenNext application, applies pending D1 migrations, and uploads the complete Worker with Wrangler. The complete Worker is required because `worker.ts` also handles inbound email, queues, workflows, and the real-time Durable Object.

To migrate an existing remote D1 database before deploying, use:

```bash
npm run db:migrate:remote
```

Remote migrations require the target account's `database_id` in your local `wrangler.jsonc`. Do not commit an account-specific database ID to a reusable repository.

## Database backups

Manual and scheduled backups use the `DATABASE_BACKUP_WORKFLOW` binding declared in `wrangler.jsonc`. Deploy the complete Worker with `npm run deploy` whenever this binding is added or changed.

## Updating Mailflare

The **Update Mailflare** button in the admin dashboard dispatches
`.github/workflows/deploy-update.yml` in the installation repository. The workflow imports
the selected upstream branch into a new update branch and opens a pull request against the
configured base branch. It does not push directly to the deployment branch or apply D1
migrations. Review and merge the pull request; merging into `main` triggers
`.github/workflows/deploy.yml`, which applies migrations and deploys the Worker.

Configure these Worker values:

- `GITHUB_UPDATE_TOKEN` — a fine-grained GitHub token for the installation repository with
  Actions write permission, used by the dashboard to dispatch the workflow.
- `GITHUB_UPDATE_REPO` — the installation repository in `owner/repository` format.
- `GITHUB_UPDATE_REF` — an optional base branch for the pull request. The repository's default
  branch is used when omitted.

Configure these GitHub Actions repository settings:

- Allow GitHub Actions to create and approve pull requests if repository policy requires it.

The updater workflow itself uses the built-in `GITHUB_TOKEN` with `contents: write` and
`pull-requests: write` permissions to push the update branch and create the pull request.

Optional repository variables:

- `UPDATE_SOURCE_REPOSITORY` — the upstream repository. Defaults to `hieunc229/mailflare`.
- `UPDATE_SOURCE_BRANCH` — the upstream branch. If omitted, the upstream repository's default
  branch is detected automatically.

If the upstream merge has conflicts, the workflow stops without pushing a branch. Resolve the
conflicts locally, review the result, and push or merge the update manually.

## Self-hosted feature availability

No commercial license key or online activation is required for this self-hosted fork, and it does not depend on Paymug. The current functionality in this repository is available after deployment without a separate licensing step; follow the setup and configuration steps above.

The source code is released under the GNU Affero General Public License v3.0 (AGPLv3). See the repository [LICENSE](../LICENSE) for the complete terms. This license and the self-hosted defaults are specific to this fork and should not be presented as an official upstream Pro or Team license.

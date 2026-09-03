import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
	return (
		<main className="page-shell">
			<p className="eyebrow">Administration</p>
			<h1>Admin</h1>
			<section className="card">
				<h2>Cloudflare resources</h2>
				<p>Manage domains, mailboxes, backups, webhooks, and audit logs.</p>
			</section>
		</main>
	);
}

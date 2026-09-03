import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { orpc } from "~/client/orpc";

export const Route = createFileRoute("/admin/")({ component: AdminPage });

function AdminPage() {
	const domains = useQuery(orpc.domains.list.queryOptions({ input: {} }));
	const mailboxes = useQuery(orpc.mailboxes.list.queryOptions({ input: {} }));
	const error = domains.error ?? mailboxes.error;

	return (
		<main className="page-shell">
			<p className="eyebrow">Administration</p>
			<h1>Admin</h1>
			{error && <p role="alert">{error.message}</p>}
			<section className="feature-grid">
				<article className="card">
					<h2>Domains</h2>
					<p>{domains.data ? `${domains.data.length} connected` : "Loading…"}</p>
					<Link className="button secondary" to="/admin/domains">
						Manage domains
					</Link>
				</article>
				<article className="card">
					<h2>Mailboxes</h2>
					<p>{mailboxes.data ? `${mailboxes.data.length} configured` : "Loading…"}</p>
					<Link className="button secondary" to="/admin/mailboxes">
						Manage mailboxes
					</Link>
				</article>
				<article className="card">
					<h2>Infrastructure</h2>
					<p>D1, R2, Queues, Durable Objects, and Workflows are managed by Alchemy.</p>
					<Link className="button secondary" to="/admin/backups">
						Database backups
					</Link>
				</article>
			</section>
		</main>
	);
}

import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/inbox")({ component: InboxPage });

function InboxPage() {
	return (
		<main className="page-shell">
			<div className="page-heading">
				<div>
					<p className="eyebrow">Mailbox</p>
					<h1>Inbox</h1>
				</div>
				<Link className="button primary" to="/compose">
					Compose
				</Link>
			</div>
			<section className="card empty-state">
				<h2>Your inbox is ready</h2>
				<p>Messages delivered by Cloudflare Email Routing will appear here.</p>
			</section>
		</main>
	);
}

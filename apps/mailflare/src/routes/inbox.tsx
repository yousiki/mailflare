import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type MailboxSummary = { id: string; email: string; name: string };

export const Route = createFileRoute("/inbox")({ component: InboxPage });

async function loadMailboxes(): Promise<MailboxSummary[]> {
	const response = await fetch("/api/rpc/mailboxes/list", {
		method: "POST",
		credentials: "same-origin",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ json: {} }),
	});
	if (!response.ok) throw new Error("Unable to load mailboxes.");
	const payload = (await response.json()) as { json: MailboxSummary[] };
	return payload.json;
}

function InboxPage() {
	const [mailboxes, setMailboxes] = useState<MailboxSummary[]>();
	const [error, setError] = useState<string>();

	useEffect(() => {
		loadMailboxes()
			.then(setMailboxes)
			.catch((cause: unknown) => {
				setError(cause instanceof Error ? cause.message : "Unable to load mailboxes.");
			});
	}, []);

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
			{error && <p role="alert">{error}</p>}
			{mailboxes?.length ? (
				<section className="feature-grid" aria-label="Your mailboxes">
					{mailboxes.map((mailbox) => (
						<article className="card" key={mailbox.id}>
							<h2>{mailbox.name}</h2>
							<p>{mailbox.email}</p>
						</article>
					))}
				</section>
			) : (
				<section className="card empty-state">
					<h2>Your inbox is ready</h2>
					<p>Messages delivered by Cloudflare Email Routing will appear here.</p>
				</section>
			)}
		</main>
	);
}

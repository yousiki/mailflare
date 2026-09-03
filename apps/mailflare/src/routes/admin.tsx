import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type Domain = { id: string; hostname: string; status: "pending" | "active" | "error" };
type Mailbox = { id: string; email: string; name: string };
type RpcResult<T> = { json?: T; message?: string };

export const Route = createFileRoute("/admin")({ component: AdminPage });

async function postRpc<T>(path: string): Promise<T> {
	const response = await fetch(`/api/rpc/${path}`, {
		method: "POST",
		credentials: "same-origin",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ json: {} }),
	});
	const result = (await response.json()) as RpcResult<T>;
	if (!response.ok || result.json === undefined)
		throw new Error(result.message ?? "Unable to load administration data.");
	return result.json;
}

function AdminPage() {
	const [counts, setCounts] = useState<{ domains: number; mailboxes: number }>();
	const [error, setError] = useState<string>();

	useEffect(() => {
		Promise.all([postRpc<Domain[]>("domains/list"), postRpc<Mailbox[]>("mailboxes/list")])
			.then(([domains, mailboxes]) =>
				setCounts({ domains: domains.length, mailboxes: mailboxes.length }),
			)
			.catch((cause: unknown) =>
				setError(cause instanceof Error ? cause.message : "Unable to load administration data."),
			);
	}, []);

	return (
		<main className="page-shell">
			<p className="eyebrow">Administration</p>
			<h1>Admin</h1>
			{error && <p role="alert">{error}</p>}
			<section className="feature-grid">
				<article className="card">
					<h2>Domains</h2>
					<p>{counts ? `${counts.domains} connected` : "Loading…"}</p>
					<Link className="button secondary" to="/admin/domains">
						Manage domains
					</Link>
				</article>
				<article className="card">
					<h2>Mailboxes</h2>
					<p>{counts ? `${counts.mailboxes} configured` : "Loading…"}</p>
					<Link className="button secondary" to="/admin/mailboxes">
						Manage mailboxes
					</Link>
				</article>
				<article className="card">
					<h2>Infrastructure</h2>
					<p>D1, R2, Queues, Durable Objects, and Workflows are managed by Alchemy.</p>
				</article>
			</section>
		</main>
	);
}

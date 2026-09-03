import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type MailboxSummary = { id: string; email: string; name: string };
type MessageSummary = {
	id: string;
	from: string;
	to: string;
	subject: string;
	snippet: string;
	direction: "inbound" | "outbound";
	read: boolean;
	starred: boolean;
	createdAt: string;
};

type RpcResult<T> = { json?: T; message?: string };

export const Route = createFileRoute("/inbox")({ component: InboxPage });

async function postRpc<T>(path: string, data: unknown): Promise<T> {
	const response = await fetch(`/api/rpc/${path}`, {
		method: "POST",
		credentials: "same-origin",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ json: data }),
	});
	const result = (await response.json()) as RpcResult<T>;
	if (!response.ok || result.json === undefined)
		throw new Error(result.message ?? "Unable to load inbox.");
	return result.json;
}

function InboxPage() {
	const [mailboxes, setMailboxes] = useState<MailboxSummary[]>();
	const [messages, setMessages] = useState<MessageSummary[]>();
	const [error, setError] = useState<string>();

	useEffect(() => {
		postRpc<MailboxSummary[]>("mailboxes/list", {})
			.then(async (items) => {
				setMailboxes(items);
				const firstMailbox = items[0];
				const loadedMessages = await postRpc<MessageSummary[]>("messages/list", {
					mailboxId: firstMailbox?.id,
				});
				setMessages(loadedMessages);
			})
			.catch((cause: unknown) => {
				setError(cause instanceof Error ? cause.message : "Unable to load inbox.");
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
			{messages?.length ? (
				<section className="card message-list" aria-label="Messages">
					{messages.map((message) => (
						<article className="message-row" key={message.id}>
							<div>
								<h2>{message.subject}</h2>
								<p>
									{message.from} → {message.to}
								</p>
								<p>{message.snippet}</p>
							</div>
							<time dateTime={message.createdAt}>
								{new Date(message.createdAt).toLocaleString()}
							</time>
						</article>
					))}
				</section>
			) : mailboxes?.length ? (
				<section className="card empty-state">
					<h2>{mailboxes[0].name}</h2>
					<p>{mailboxes[0].email} is ready to receive messages.</p>
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

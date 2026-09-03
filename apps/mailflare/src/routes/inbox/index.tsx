import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { mailflareClient } from "~/client/orpc";

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
	createdAt: Date;
};

export const Route = createFileRoute("/inbox/")({ component: InboxPage });

function InboxPage() {
	const [mailboxes, setMailboxes] = useState<MailboxSummary[]>();
	const [messages, setMessages] = useState<MessageSummary[]>();
	const [error, setError] = useState<string>();

	useEffect(() => {
		mailflareClient.mailboxes
			.list({})
			.then(async (items) => {
				setMailboxes(items);
				setMessages(
					await mailflareClient.messages.list({ mailboxId: items[0]?.id, folder: "inbox" }),
				);
			})
			.catch((cause: unknown) =>
				setError(cause instanceof Error ? cause.message : "Unable to load inbox."),
			);
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
				<section className="card message-list" aria-label="Inbox messages">
					{messages.map((message) => (
						<Link
							className="message-row"
							to="/inbox/$messageId"
							params={{ messageId: message.id }}
							key={message.id}
						>
							<div>
								<h2>{message.subject}</h2>
								<p>
									{message.from} → {message.to}
								</p>
								<p>{message.snippet}</p>
							</div>
							<time dateTime={message.createdAt.toISOString()}>
								{message.createdAt.toLocaleString()}
							</time>
						</Link>
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

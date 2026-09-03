import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { MessageFolder } from "../server/messages";

type Message = {
	id: string;
	from: string;
	to: string;
	subject: string;
	snippet: string;
	createdAt: string;
};

type RpcResult<T> = { json?: T; message?: string };

async function loadMessages(folder: MessageFolder): Promise<Message[]> {
	const response = await fetch("/api/rpc/messages/list", {
		method: "POST",
		credentials: "same-origin",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ json: { folder } }),
	});
	const result = (await response.json()) as RpcResult<Message[]>;
	if (!response.ok || result.json === undefined)
		throw new Error(result.message ?? "Unable to load messages.");
	return result.json;
}

export type MessageFolderPageProps = {
	folder: MessageFolder;
	title: string;
	description: string;
};

export function MessageFolderPage({ folder, title, description }: MessageFolderPageProps) {
	const [messages, setMessages] = useState<Message[]>();
	const [error, setError] = useState<string>();

	useEffect(() => {
		loadMessages(folder)
			.then(setMessages)
			.catch((cause: unknown) =>
				setError(cause instanceof Error ? cause.message : "Unable to load messages."),
			);
	}, [folder]);

	return (
		<main className="page-shell">
			<div className="page-heading">
				<div>
					<p className="eyebrow">Mailbox</p>
					<h1>{title}</h1>
					<p>{description}</p>
				</div>
				<Link className="button primary" to="/compose">
					Compose
				</Link>
			</div>
			{error && <p role="alert">{error}</p>}
			{messages?.length ? (
				<section className="card message-list" aria-label={`${title} messages`}>
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
			) : (
				<section className="card empty-state">
					<h2>No messages</h2>
					<p>This folder is empty.</p>
				</section>
			)}
		</main>
	);
}

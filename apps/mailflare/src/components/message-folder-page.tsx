import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { orpc } from "~/client/orpc";
import type { MessageFolder } from "../server/messages";

export type MessageFolderPageProps = {
	folder: MessageFolder;
	title: string;
	description: string;
};

export function MessageFolderPage({ folder, title, description }: MessageFolderPageProps) {
	const messages = useQuery({
		...orpc.messages.list.queryOptions({ input: { folder } }),
		enabled: typeof window !== "undefined",
	});

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
			{messages.error && <p role="alert">{messages.error.message}</p>}
			{messages.data?.length ? (
				<section className="card message-list" aria-label={`${title} messages`}>
					{messages.data.map((message) => (
						<article className="message-row" key={message.id}>
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
						</article>
					))}
				</section>
			) : (
				<section className="card empty-state">
					<h2>{messages.isPending ? "Loading messages…" : "No messages"}</h2>
					<p>{messages.isPending ? "" : "This folder is empty."}</p>
				</section>
			)}
		</main>
	);
}

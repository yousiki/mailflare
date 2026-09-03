import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { orpc } from "~/client/orpc";

export const Route = createFileRoute("/inbox/$messageId")({ component: MessageDetailPage });

function MessageDetailPage() {
	const { messageId } = useParams({ from: "/inbox/$messageId" });
	const queryClient = useQueryClient();
	const message = useQuery(orpc.messages.get.queryOptions({ input: { messageId } }));
	const read = useMutation(
		orpc.messages.read.mutationOptions({
			onSuccess: () =>
				queryClient.invalidateQueries({
					queryKey: orpc.messages.get.key({ input: { messageId } }),
				}),
		}),
	);
	const star = useMutation(
		orpc.messages.star.mutationOptions({
			onSuccess: () =>
				queryClient.invalidateQueries({
					queryKey: orpc.messages.get.key({ input: { messageId } }),
				}),
		}),
	);

	if (message.isPending)
		return (
			<main className="page-shell narrow">
				<p>Loading message…</p>
			</main>
		);
	if (message.error)
		return (
			<main className="page-shell narrow">
				<p role="alert">{message.error.message}</p>
				<Link to="/inbox">Back to inbox</Link>
			</main>
		);
	if (!message.data)
		return (
			<main className="page-shell narrow">
				<p role="alert">Message not found.</p>
				<Link to="/inbox">Back to inbox</Link>
			</main>
		);

	return (
		<main className="page-shell narrow">
			<Link to="/inbox">← Back to inbox</Link>
			<article className="card message-detail">
				<div className="page-heading">
					<div>
						<p className="eyebrow">{message.data.direction}</p>
						<h1>{message.data.subject}</h1>
					</div>
					<button
						className="button secondary"
						type="button"
						onClick={() => star.mutate({ messageId })}
					>
						{message.data.starred ? "Unstar" : "Star"}
					</button>
				</div>
				<p>
					<strong>From:</strong> {message.data.from}
				</p>
				<p>
					<strong>To:</strong> {message.data.to}
				</p>
				<p>{message.data.snippet}</p>
				{message.data.textBody && <pre className="message-body">{message.data.textBody}</pre>}
				{!message.data.read && (
					<button
						className="button primary"
						type="button"
						onClick={() => read.mutate({ messageId, read: true })}
					>
						Mark as read
					</button>
				)}
			</article>
		</main>
	);
}

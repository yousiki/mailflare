import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "~/client/orpc";

export const Route = createFileRoute("/admin/backups")({ component: BackupsPage });

function BackupsPage() {
	const backups = useQuery(orpc.backups.list.queryOptions({ input: {} }));

	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Administration</p>
			<h1>Backups</h1>
			{backups.error && <p role="alert">{backups.error.message}</p>}
			{backups.data?.length ? (
				<section className="card message-list" aria-label="Database backups">
					{backups.data.map((backup) => (
						<article className="message-row" key={backup.id}>
							<div>
								<h2>{backup.filename ?? backup.id}</h2>
								<p>Status: {backup.status}</p>
								<p>{backup.error ?? `${backup.trigger} backup`}</p>
							</div>
							<time dateTime={backup.createdAt.toISOString()}>
								{backup.createdAt.toLocaleString()}
							</time>
						</article>
					))}
				</section>
			) : (
				<section className="card empty-state">
					<h2>{backups.isPending ? "Loading backups…" : "No backups"}</h2>
					<p>{backups.isPending ? "" : "Completed backups will appear here."}</p>
				</section>
			)}
		</main>
	);
}

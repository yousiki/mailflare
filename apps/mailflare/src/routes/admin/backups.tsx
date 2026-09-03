import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { orpc } from "~/client/orpc";

export const Route = createFileRoute("/admin/backups")({ component: BackupsPage });

function BackupsPage() {
	const backups = useQuery(orpc.backups.list.queryOptions({ input: {} }));
	const startBackup = useMutation(
		orpc.backups.start.mutationOptions({
			onSuccess: () => backups.refetch(),
		}),
	);

	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Administration</p>
			<div className="page-heading">
				<h1>Backups</h1>
				<button
					className="button primary"
					type="button"
					onClick={() => startBackup.mutate({})}
					disabled={startBackup.isPending}
				>
					{startBackup.isPending ? "Starting…" : "Start backup"}
				</button>
			</div>
			{backups.error && <p role="alert">{backups.error.message}</p>}
			{startBackup.error && <p role="alert">{startBackup.error.message}</p>}
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
					<p>
						{backups.isPending ? "" : "Start a backup to create a protected database snapshot."}
					</p>
				</section>
			)}
		</main>
	);
}

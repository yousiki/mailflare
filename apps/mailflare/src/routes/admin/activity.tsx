import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { orpc } from "~/client/orpc";

export const Route = createFileRoute("/admin/activity")({ component: ActivityPage });

function ActivityPage() {
	const activity = useQuery(orpc.admin.activity.queryOptions({ input: {} }));
	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Administration</p>
			<h1>Activity</h1>
			{activity.error && <p role="alert">{activity.error.message}</p>}
			{activity.data?.length ? (
				<section className="card message-list" aria-label="Authentication activity">
					{activity.data.map((entry) => (
						<article className="message-row" key={entry.id}>
							<div>
								<h2>{entry.action}</h2>
								<p>{entry.actorEmail ?? "System"}</p>
								<p>{entry.metadata ?? ""}</p>
							</div>
							<time dateTime={entry.createdAt.toISOString()}>
								{entry.createdAt.toLocaleString()}
							</time>
						</article>
					))}
				</section>
			) : (
				<section className="card empty-state">
					<h2>{activity.isPending ? "Loading activity…" : "No recent activity"}</h2>
					<p>{activity.isPending ? "" : "Login and logout events will appear here."}</p>
				</section>
			)}
		</main>
	);
}

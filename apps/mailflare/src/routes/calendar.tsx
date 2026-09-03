import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { orpc } from "~/client/orpc";

export const Route = createFileRoute("/calendar")({ component: CalendarPage });

function CalendarPage() {
	const events = useQuery(orpc.calendar.list.queryOptions({ input: {} }));

	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Planning</p>
			<h1>Calendar</h1>
			{events.error && <p role="alert">{events.error.message}</p>}
			{events.data?.length ? (
				<section className="card message-list" aria-label="Upcoming events">
					{events.data.map((event) => (
						<article className="message-row" key={event.id}>
							<div>
								<h2>{event.title}</h2>
								<p>{event.description}</p>
								<p>{event.location}</p>
							</div>
							<time dateTime={event.startsAt.toISOString()}>{event.startsAt.toLocaleString()}</time>
						</article>
					))}
				</section>
			) : (
				<section className="card empty-state">
					<h2>{events.isPending ? "Loading calendar…" : "No upcoming events"}</h2>
					<p>{events.isPending ? "" : "Events created from Mailflare will appear here."}</p>
				</section>
			)}
		</main>
	);
}

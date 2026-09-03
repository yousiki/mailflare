import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type Event = {
	id: string;
	title: string;
	description: string;
	location: string;
	startsAt: string;
	endsAt: string;
	attendees: string[];
};
type RpcResult<T> = { json?: T; message?: string };

export const Route = createFileRoute("/calendar")({ component: CalendarPage });

function CalendarPage() {
	const [events, setEvents] = useState<Event[]>();
	const [error, setError] = useState<string>();

	useEffect(() => {
		fetch("/api/rpc/calendar/list", {
			method: "POST",
			credentials: "same-origin",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ json: {} }),
		})
			.then(async (response) => {
				const result = (await response.json()) as RpcResult<Event[]>;
				if (!response.ok || result.json === undefined)
					throw new Error(result.message ?? "Unable to load calendar.");
				setEvents(result.json);
			})
			.catch((cause: unknown) =>
				setError(cause instanceof Error ? cause.message : "Unable to load calendar."),
			);
	}, []);

	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Planning</p>
			<h1>Calendar</h1>
			{error && <p role="alert">{error}</p>}
			{events?.length ? (
				<section className="card message-list" aria-label="Upcoming events">
					{events.map((event) => (
						<article className="message-row" key={event.id}>
							<div>
								<h2>{event.title}</h2>
								<p>{event.description}</p>
								<p>{event.location}</p>
							</div>
							<time dateTime={event.startsAt}>{new Date(event.startsAt).toLocaleString()}</time>
						</article>
					))}
				</section>
			) : (
				<section className="card empty-state">
					<h2>No upcoming events</h2>
					<p>Events created from Mailflare will appear here.</p>
				</section>
			)}
		</main>
	);
}

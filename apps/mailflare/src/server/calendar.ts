import { and, asc, eq, gte, lt } from "drizzle-orm";
import { getDb } from "../../../../src/db";
import { calendarEvents } from "../../../../src/db/schema";

export type CalendarEventSummary = {
	id: string;
	title: string;
	description: string;
	location: string;
	startsAt: Date;
	endsAt: Date;
	attendees: string[];
};

export async function listCalendarEventsForUser(
	env: CloudflareEnv,
	userId: string,
	start = new Date(),
	end = new Date(start.getTime() + 90 * 86_400_000),
): Promise<CalendarEventSummary[]> {
	const rows = await getDb(env)
		.select()
		.from(calendarEvents)
		.where(
			and(
				eq(calendarEvents.userId, userId),
				gte(calendarEvents.startsAt, start),
				lt(calendarEvents.startsAt, end),
			),
		)
		.orderBy(asc(calendarEvents.startsAt));
	return rows.map((event) => ({
		id: event.id,
		title: event.title,
		description: event.description,
		location: event.location,
		startsAt: event.startsAt,
		endsAt: event.endsAt,
		attendees: JSON.parse(event.attendees) as string[],
	}));
}

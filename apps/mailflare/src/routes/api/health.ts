import { createFileRoute } from "@tanstack/react-router";
import { app } from "~/server/app";

export const Route = createFileRoute("/api/health")({
	server: {
		handlers: {
			GET: ({ request }) => app.fetch(request),
		},
	},
});

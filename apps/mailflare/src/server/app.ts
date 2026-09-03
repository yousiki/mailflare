import { Hono } from "hono";
import { z } from "zod";

export type MailflareBindings = Record<string, unknown>;

export type MailflareContext = {
	Bindings: MailflareBindings;
};

export const healthResponse = z.object({
	service: z.literal("mailflare"),
	status: z.literal("ok"),
});

export const app = new Hono<MailflareContext>().get("/api/health", (c) =>
	c.json(healthResponse.parse({ service: "mailflare", status: "ok" })),
);

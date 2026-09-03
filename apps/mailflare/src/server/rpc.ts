import { os } from "@orpc/server";
import { z } from "zod";

export const healthProcedure = os
	.route({ method: "GET", path: "/health" })
	.input(z.object({}))
	.output(z.object({ service: z.literal("mailflare"), status: z.literal("ok") }))
	.handler(() => ({ service: "mailflare" as const, status: "ok" as const }));

export const rpcRouter = os.router({
	health: healthProcedure,
});

export type MailflareRpcRouter = typeof rpcRouter;

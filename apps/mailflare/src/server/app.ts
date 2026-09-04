import { Hono } from "hono";
import { z } from "zod";
import { createMailflareAuth } from "./auth";
import {
	assertInitialSetupAvailable,
	createInitialAdministrator,
	ensureApplicationUser,
	removeIncompleteAuthUser,
	SetupAlreadyCompletedError,
} from "./setup";
import { rejectCrossOriginMutation } from "./request-security";

export type MailflareBindings = CloudflareEnv;

export type MailflareContext = {
	Bindings: MailflareBindings;
};

export const healthResponse = z.object({
	service: z.literal("mailflare"),
	status: z.literal("ok"),
});

const setupInput = z.object({
	name: z.string().trim().min(1).max(120),
	email: z.email(),
	password: z.string().min(12).max(256),
});

export const app = new Hono<MailflareContext>()
	.get("/api/health", (c) => c.json(healthResponse.parse({ service: "mailflare", status: "ok" })))
	.post("/api/auth/sign-up/email", async (c) => {
		const blocked = rejectCrossOriginMutation(c.req.raw);
		if (blocked) return blocked;
		try {
			const input = setupInput.parse(await c.req.json());
			const result = await createMailflareAuth(c.env).api.signUpEmail({
				returnHeaders: true,
				headers: c.req.raw.headers,
				body: input,
			});
			await ensureApplicationUser(c.env, { ...input, id: result.response.user.id });
			const response = Response.json(result.response, { status: 201 });
			result.headers.forEach((value, key) => response.headers.append(key, value));
			return response;
		} catch (error) {
			if (error instanceof z.ZodError)
				return c.json({ error: "Invalid registration details." }, 400);
			return c.json({ error: "Unable to create the account." }, 500);
		}
	})
	.on(["GET", "POST"], "/api/auth/*", async (c) => {
		const auth = createMailflareAuth(c.env);
		return auth.handler(c.req.raw);
	})
	.post("/api/setup/admin", async (c) => {
		const blocked = rejectCrossOriginMutation(c.req.raw);
		if (blocked) return blocked;
		let input: z.infer<typeof setupInput> | undefined;
		try {
			input = setupInput.parse(await c.req.json());
			await assertInitialSetupAvailable(c.env);
			await removeIncompleteAuthUser(c.env, input.email);
			const auth = createMailflareAuth(c.env);
			const result = await auth.api.signUpEmail({
				returnHeaders: true,
				headers: c.req.raw.headers,
				body: input,
			});
			const administrator = await createInitialAdministrator(c.env, {
				...input,
				id: result.response.user.id,
			});
			const response = Response.json({ user: administrator }, { status: 201 });
			result.headers.forEach((value, key) => response.headers.append(key, value));
			return response;
		} catch (error) {
			if (input) {
				try {
					await removeIncompleteAuthUser(c.env, input.email);
				} catch (cleanupError) {
					console.error("Incomplete setup cleanup failed", cleanupError);
				}
			}
			console.error("Administrator setup failed", error);
			if (error instanceof SetupAlreadyCompletedError) {
				return c.json({ error: error.message }, 409);
			}
			if (error instanceof z.ZodError) {
				return c.json({ error: "Invalid setup details." }, 400);
			}
			return c.json({ error: "Unable to create the administrator." }, 500);
		}
	});

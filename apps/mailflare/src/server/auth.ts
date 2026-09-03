import type { D1Database } from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { authSchema } from "./auth-schema";

export type AuthEnvironment = {
	DB: D1Database;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
};

export function createMailflareAuth(env: AuthEnvironment) {
	const database = drizzle(env.DB, { schema: authSchema });
	return betterAuth({
		database: drizzleAdapter(database, { provider: "sqlite" }),
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		emailAndPassword: { enabled: true },
		session: { cookieCache: { enabled: true, maxAge: 60 * 5 } },
	});
}

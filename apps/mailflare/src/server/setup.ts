import { eq } from "drizzle-orm";
import { getDb } from "../../../../src/db";
import { users } from "../../../../src/db/schema";
import { hashPassword } from "../../../../src/lib/auth/password";

export type InitialAdministrator = {
	id: string;
	email: string;
	name: string;
	password: string;
};

export type ApplicationUser = {
	id: string;
	email: string;
	name: string;
	password: string;
	role?: "admin" | "user";
};

export class SetupAlreadyCompletedError extends Error {
	constructor() {
		super("Mailflare setup has already been completed.");
		this.name = "SetupAlreadyCompletedError";
	}
}

export async function ensureApplicationUser(env: CloudflareEnv, user: ApplicationUser) {
	const db = getDb(env);
	const [existing] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.id, user.id))
		.limit(1);
	if (existing) return existing;

	await db.insert(users).values({
		id: user.id,
		email: user.email,
		name: user.name,
		passwordHash: hashPassword(user.password),
		role: user.role ?? "user",
		canManageMailboxes: user.role === "admin",
	});
	return { id: user.id };
}

export async function createInitialAdministrator(
	env: CloudflareEnv,
	administrator: InitialAdministrator,
) {
	const db = getDb(env);
	const [existing] = await db.select({ id: users.id }).from(users).limit(1);
	if (existing) throw new SetupAlreadyCompletedError();

	await ensureApplicationUser(env, { ...administrator, role: "admin" });
	const [created] = await db
		.select({ id: users.id, email: users.email, name: users.name, role: users.role })
		.from(users)
		.where(eq(users.id, administrator.id))
		.limit(1);
	return created;
}

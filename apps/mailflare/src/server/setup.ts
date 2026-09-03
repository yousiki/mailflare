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

export class SetupAlreadyCompletedError extends Error {
	constructor() {
		super("Mailflare setup has already been completed.");
		this.name = "SetupAlreadyCompletedError";
	}
}

export async function createInitialAdministrator(
	env: CloudflareEnv,
	administrator: InitialAdministrator,
) {
	const db = getDb(env);
	const [existing] = await db.select({ id: users.id }).from(users).limit(1);
	if (existing) throw new SetupAlreadyCompletedError();

	await db.insert(users).values({
		id: administrator.id,
		email: administrator.email,
		name: administrator.name,
		passwordHash: hashPassword(administrator.password),
		role: "admin",
		canManageMailboxes: true,
	});

	const [created] = await db
		.select({ id: users.id, email: users.email, name: users.name, role: users.role })
		.from(users)
		.where(eq(users.id, administrator.id))
		.limit(1);
	return created;
}

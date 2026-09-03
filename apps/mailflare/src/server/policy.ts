import { eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { getDb } from "../../../../src/db";
import { users } from "../../../../src/db/schema";

export type MailflareRole = "admin" | "member";
export type MailflarePermission =
	| "public"
	| "authenticated"
	| "mailbox.read"
	| "mailbox.write"
	| "mailbox.send"
	| "domain.manage"
	| "account.manage"
	| "admin";

const rolePermissions: Record<MailflareRole, readonly MailflarePermission[]> = {
	admin: [
		"public",
		"authenticated",
		"mailbox.read",
		"mailbox.write",
		"mailbox.send",
		"domain.manage",
		"account.manage",
		"admin",
	],
	member: ["public", "authenticated", "mailbox.read", "mailbox.write", "mailbox.send"],
};

export async function getMailflareRole(
	env: CloudflareEnv,
	userId: string,
): Promise<MailflareRole | null> {
	const [user] = await getDb(env)
		.select({ role: users.role })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	if (!user) return null;
	return user.role === "admin" ? "admin" : "member";
}

export function requirePermission(role: MailflareRole, permission: MailflarePermission): void {
	if (!rolePermissions[role].includes(permission)) {
		throw new ORPCError("FORBIDDEN", { message: "You do not have permission for this action." });
	}
}

export async function requireAdmin(env: CloudflareEnv, userId: string): Promise<void> {
	const role = await getMailflareRole(env, userId);
	if (!role) throw new ORPCError("UNAUTHORIZED", { message: "Sign in to continue." });
	requirePermission(role, "admin");
}

import { ORPCError } from "@orpc/server";

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

export function requirePermission(role: MailflareRole, permission: MailflarePermission): void {
	if (!rolePermissions[role].includes(permission)) {
		throw new ORPCError("FORBIDDEN", { message: "You do not have permission for this action." });
	}
}

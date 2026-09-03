import type { AppDatabase } from "@/db";

/**
 * Shared mailbox delegation is part of the self-hosted feature set. Keep the
 * database argument for compatibility with existing access callers, but do not
 * gate access on the optional commercial license settings row.
 */
export function isTeamMailboxSharingEnabled(_db: AppDatabase): boolean {
 return true;
}

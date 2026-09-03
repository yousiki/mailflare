import { authFetch } from "@/lib/auth/client";
import { clearMailboxesCache } from "@/components/mailbox-provider-utils";
import type { MailboxDetail, MailboxDetailResponse, SharedInboxAccessResponse } from "./types";

export function getMailboxAddress(mailbox: Pick<MailboxDetail, "localPart" | "hostname">): string {
	return `${mailbox.localPart}@${mailbox.hostname}`;
}

export async function fetchMailbox(id: string): Promise<MailboxDetail> {
	const res = await authFetch(`/api/mailboxes/${id}`);
	const json = (await res.json()) as MailboxDetailResponse;

	if (!res.ok || !json.mailbox) {
		throw new Error(json.error ?? "Failed to load mailbox");
	}

	return json.mailbox;
}

export async function updateMailboxSettings(
	id: string,
	input: { displayName: string; useAllDomains: boolean },
): Promise<MailboxDetail> {
	const res = await authFetch(`/api/mailboxes/${id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	const json = (await res.json()) as MailboxDetailResponse;

	if (!res.ok || !json.mailbox) {
		throw new Error(json.error ?? "Failed to update mailbox");
	}

	clearMailboxesCache();
	return json.mailbox;
}

export async function fetchSharedInboxAccess(id: string): Promise<SharedInboxAccessResponse> {
	const res = await authFetch(`/api/mailboxes/${id}/access`);
	const json = (await res.json()) as SharedInboxAccessResponse;
	if (!res.ok) throw new Error(json.error ?? "Failed to load shared inbox access");
	return json;
}

export async function grantSharedInboxAccess(id: string, userId: string): Promise<void> {
	const res = await authFetch(`/api/mailboxes/${id}/access`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ userId, permission: "full_access" }),
	});
	const json = (await res.json()) as { error?: string };
	if (!res.ok) throw new Error(json.error ?? "Failed to add account");
}

export async function revokeSharedInboxAccess(id: string, userId: string): Promise<void> {
	const res = await authFetch(`/api/mailboxes/${id}/access?userId=${encodeURIComponent(userId)}`, {
		method: "DELETE",
	});
	const json = (await res.json()) as { error?: string };
	if (!res.ok) throw new Error(json.error ?? "Failed to remove account");
}

export async function deleteMailbox(id: string): Promise<void> {
	const res = await authFetch(`/api/mailboxes/${id}`, { method: "DELETE" });
	const json = (await res.json()) as { error?: string };
	if (!res.ok) throw new Error(json.error ?? "Failed to delete mailbox");

	clearMailboxesCache();
}

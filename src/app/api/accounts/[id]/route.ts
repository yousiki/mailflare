import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { updateManagedAccountSchema } from "@/lib/validators";
import { requireTeamAdmin } from "../utils";
import type { AccountRouteParams } from "./types";
import { selectAccountById, updateAccountCredentials } from "./utils";

export async function GET(request: Request, { params }: AccountRouteParams) {
	const access = await requireTeamAdmin(request);
	if (access.error) return access.error;
	const { id } = await params;
	const account = await selectAccountById(getDb(access.env), id);
	if (!account || (account.id !== access.user!.id && account.createdByUserId !== access.user!.id)) {
		return NextResponse.json({ error: "Account not found" }, { status: 404 });
	}
	return NextResponse.json({
		account: {
			id: account.id,
			email: account.email,
			name: account.name,
			role: account.role,
			disabled: account.disabled,
			canManageMailboxes: account.canManageMailboxes,
			forwardingEmail: account.forwardingEmail,
			canForwardEmail: true,
			hasAvatar: !!account.avatarKey,
		},
	});
}

export async function PATCH(request: Request, { params }: AccountRouteParams) {
	const access = await requireTeamAdmin(request);
	if (access.error) return access.error;
	const { id } = await params;
	const db = getDb(access.env);
	const account = await selectAccountById(db, id);
	if (!account || (account.id !== access.user!.id && account.createdByUserId !== access.user!.id)) {
		return NextResponse.json({ error: "Account not found" }, { status: 404 });
	}
	const parsed = updateManagedAccountSchema.safeParse(await request.json());
	if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
	await updateAccountCredentials(db, id, { name: parsed.data.name, password: null });
	await db.update(users).set({
		role: parsed.data.role,
		disabled: parsed.data.disabled,
		canManageMailboxes: parsed.data.canManageMailboxes,
		...(parsed.data.forwardingEmail !== undefined ? { forwardingEmail: parsed.data.forwardingEmail } : {}),
	}).where(eq(users.id, id));
	return NextResponse.json({ ok: true });
}

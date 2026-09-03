import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type User = { id: string; email: string; name: string };
type RpcResult<T> = { json?: T; message?: string };

export const Route = createFileRoute("/settings")({ component: SettingsPage });

async function loadCurrentUser(): Promise<User | null> {
	const response = await fetch("/api/rpc/auth/me", {
		method: "POST",
		credentials: "same-origin",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ json: {} }),
	});
	const result = (await response.json()) as RpcResult<{ user: User | null }>;
	if (!response.ok || result.json === undefined)
		throw new Error(result.message ?? "Unable to load your profile.");
	return result.json.user;
}

function SettingsPage() {
	const [user, setUser] = useState<User | null>();
	const [error, setError] = useState<string>();

	useEffect(() => {
		loadCurrentUser()
			.then(setUser)
			.catch((cause: unknown) =>
				setError(cause instanceof Error ? cause.message : "Unable to load your profile."),
			);
	}, []);

	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Account</p>
			<h1>Settings</h1>
			{error && <p role="alert">{error}</p>}
			<section className="card">
				<h2>Profile</h2>
				{user ? (
					<>
						<p>{user.name}</p>
						<p>{user.email}</p>
					</>
				) : (
					<p>Loading profile…</p>
				)}
			</section>
			<section className="card">
				<h2>Manage Mailflare</h2>
				<p>Use the administration area to manage domains and mailboxes.</p>
				<Link className="button secondary" to="/admin">
					Open administration
				</Link>
			</section>
		</main>
	);
}

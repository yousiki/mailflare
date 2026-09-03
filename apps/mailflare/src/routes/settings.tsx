import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { orpc } from "~/client/orpc";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
	const profile = useQuery(orpc.auth.me.queryOptions({ input: {} }));

	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Account</p>
			<h1>Settings</h1>
			{profile.error && <p role="alert">{profile.error.message}</p>}
			<section className="card">
				<h2>Profile</h2>
				{profile.data?.user ? (
					<>
						<p>{profile.data.user.name}</p>
						<p>{profile.data.user.email}</p>
					</>
				) : (
					<p>{profile.isPending ? "Loading profile…" : "No profile available."}</p>
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

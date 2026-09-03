import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
	return (
		<main className="page-shell">
			<p className="eyebrow">Account</p>
			<h1>Settings</h1>
			<section className="card">
				<h2>Mailflare settings</h2>
				<p>Manage your profile, mailboxes, domains, routing rules, and preferences.</p>
			</section>
		</main>
	);
}

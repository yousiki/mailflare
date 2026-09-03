import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

export const Route = createFileRoute("/setup")({ component: SetupPage });

function SetupPage() {
	const [error, setError] = useState<string>();
	const [pending, setPending] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(undefined);
		setPending(true);
		const form = new FormData(event.currentTarget);
		try {
			const response = await fetch("/api/setup/admin", {
				method: "POST",
				credentials: "same-origin",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					name: form.get("name"),
					email: form.get("email"),
					password: form.get("password"),
				}),
			});
			const result = (await response.json()) as { error?: string };
			if (!response.ok) throw new Error(result.error ?? "Unable to complete setup.");
			window.location.assign("/inbox");
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Unable to complete setup.");
			setPending(false);
		}
	}

	return (
		<main className="page-shell narrow">
			<h1>Set up Mailflare</h1>
			<p>Create the first administrator for this fresh installation.</p>
			<form className="card" onSubmit={handleSubmit}>
				<label>
					Name
					<input name="name" autoComplete="name" required />
				</label>
				<label>
					Email
					<input name="email" type="email" autoComplete="email" required />
				</label>
				<label>
					Password
					<input
						name="password"
						type="password"
						autoComplete="new-password"
						minLength={12}
						required
					/>
				</label>
				{error && <p role="alert">{error}</p>}
				<button className="button primary" type="submit" disabled={pending}>
					{pending ? "Creating administrator…" : "Create administrator"}
				</button>
				<Link to="/login">Already configured? Sign in</Link>
			</form>
		</main>
	);
}

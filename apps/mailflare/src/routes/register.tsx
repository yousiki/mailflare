import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
	const [error, setError] = useState<string>();
	const [pending, setPending] = useState(false);
	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(undefined);
		setPending(true);
		const form = new FormData(event.currentTarget);
		try {
			const response = await fetch("/api/auth/sign-up/email", {
				method: "POST",
				credentials: "same-origin",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					name: form.get("name"),
					email: form.get("email"),
					password: form.get("password"),
				}),
			});
			const result = (await response.json()) as { message?: string; error?: { message?: string } };
			if (!response.ok)
				throw new Error(result.error?.message ?? result.message ?? "Unable to register.");
			window.location.assign("/inbox");
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Unable to register.");
			setPending(false);
		}
	}
	return (
		<main className="page-shell narrow">
			<h1>Create your Mailflare account</h1>
			<form className="card" onSubmit={submit}>
				<label>
					Name
					<input name="name" required />
				</label>
				<label>
					Email
					<input name="email" type="email" required />
				</label>
				<label>
					Password
					<input name="password" type="password" minLength={12} required />
				</label>
				{error && <p role="alert">{error}</p>}
				<button className="button primary" type="submit" disabled={pending}>
					{pending ? "Creating account…" : "Register"}
				</button>
				<Link to="/login">Back to sign in</Link>
			</form>
		</main>
	);
}

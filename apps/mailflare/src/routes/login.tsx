import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
	const [error, setError] = useState<string>();
	const [pending, setPending] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(undefined);
		setPending(true);
		const form = new FormData(event.currentTarget);
		try {
			const response = await fetch("/api/auth/sign-in/email", {
				method: "POST",
				credentials: "same-origin",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
			});
			const result = (await response.json()) as { message?: string; error?: { message?: string } };
			if (!response.ok)
				throw new Error(result.error?.message ?? result.message ?? "Unable to sign in.");
			window.location.assign("/inbox");
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Unable to sign in.");
			setPending(false);
		}
	}

	return (
		<main className="page-shell narrow">
			<h1>Sign in to Mailflare</h1>
			<p>Use your Mailflare account to access your inbox.</p>
			<form className="card" onSubmit={handleSubmit}>
				<label>
					Email
					<input name="email" type="email" autoComplete="username" required />
				</label>
				<label>
					Password
					<input name="password" type="password" autoComplete="current-password" required />
				</label>
				{error && <p role="alert">{error}</p>}
				<button className="button primary" type="submit" disabled={pending}>
					{pending ? "Signing in…" : "Sign in"}
				</button>
				<Link to="/register">Create an account</Link>
			</form>
		</main>
	);
}

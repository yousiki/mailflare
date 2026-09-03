import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
	return (
		<main className="page-shell narrow">
			<h1>Sign in to Mailflare</h1>
			<p>Use your Mailflare account to access your inbox.</p>
			<form className="card">
				<label>
					Email
					<input name="email" type="email" autoComplete="username" required />
				</label>
				<label>
					Password
					<input name="password" type="password" autoComplete="current-password" required />
				</label>
				<button className="button primary" type="submit">
					Sign in
				</button>
				<Link to="/register">Create an account</Link>
			</form>
		</main>
	);
}

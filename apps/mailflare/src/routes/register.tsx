import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
	return (
		<main className="page-shell narrow">
			<h1>Create your Mailflare account</h1>
			<form className="card">
				<label>
					Email
					<input name="email" type="email" required />
				</label>
				<label>
					Password
					<input name="password" type="password" minLength={12} required />
				</label>
				<button className="button primary" type="submit">
					Register
				</button>
				<Link to="/login">Back to sign in</Link>
			</form>
		</main>
	);
}

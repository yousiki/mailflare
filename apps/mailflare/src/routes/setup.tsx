import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/setup")({ component: SetupPage });

function SetupPage() {
	return (
		<main className="page-shell narrow">
			<h1>Set up Mailflare</h1>
			<p>Create the first administrator for this fresh installation.</p>
			<form className="card">
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
				<button className="button primary" type="submit">
					Create administrator
				</button>
				<Link to="/login">Already configured? Sign in</Link>
			</form>
		</main>
	);
}

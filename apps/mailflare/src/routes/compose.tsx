import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/compose")({ component: ComposePage });

function ComposePage() {
	return (
		<main className="page-shell narrow">
			<h1>Compose</h1>
			<form className="card">
				<label>
					To
					<input name="to" type="email" required />
				</label>
				<label>
					Subject
					<input name="subject" required />
				</label>
				<label>
					Message
					<textarea name="body" rows={8} required />
				</label>
				<button className="button primary" type="submit">
					Send message
				</button>
			</form>
		</main>
	);
}

import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
	return (
		<main className="page-shell">
			<section className="hero" aria-labelledby="hero-title">
				<p className="eyebrow">Modern Cloudflare email</p>
				<h1 id="hero-title">Your inbox, on your Cloudflare account.</h1>
				<p className="lede">
					Mailflare keeps mail, attachments, and infrastructure under your control.
				</p>
				<div className="actions">
					<Link className="button primary" to="/setup">
						Set up Mailflare
					</Link>
					<Link className="button secondary" to="/login">
						Open inbox
					</Link>
				</div>
			</section>
			<section className="feature-grid" aria-label="Mailflare capabilities">
				<article>
					<h2>Receive</h2>
					<p>Cloudflare Email Routing delivers messages to your inbox.</p>
				</article>
				<article>
					<h2>Send</h2>
					<p>Compose and deliver mail with Cloudflare Email Sending.</p>
				</article>
				<article>
					<h2>Own</h2>
					<p>D1 and R2 keep your mail data in your account.</p>
				</article>
			</section>
		</main>
	);
}

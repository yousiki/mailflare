import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { mailflareClient } from "~/client/orpc";

type SetupStep = "administrator" | "domain" | "mailbox" | "complete";
export const Route = createFileRoute("/setup")({ component: SetupPage });

function SetupPage() {
	const [step, setStep] = useState<SetupStep>("administrator");
	const [domainId, setDomainId] = useState("");
	const [domainName, setDomainName] = useState("");
	const [mailboxAddress, setMailboxAddress] = useState("");
	const [error, setError] = useState<string>();
	const [pending, setPending] = useState(false);
	async function run(action: () => Promise<void>) {
		setError(undefined);
		setPending(true);
		try {
			await action();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Unable to complete setup.");
		} finally {
			setPending(false);
		}
	}
	function administrator(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		void run(async () => {
			const form = new FormData(event.currentTarget);
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
			if (!response.ok) throw new Error(result.error ?? "Unable to create the administrator.");
			setStep("domain");
		});
	}
	function domain(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		void run(async () => {
			const result = await mailflareClient.domains.add({
				hostname: String(new FormData(event.currentTarget).get("hostname")),
			});
			setDomainId(result.id);
			setDomainName(result.hostname);
			setStep("mailbox");
		});
	}
	function mailbox(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		void run(async () => {
			const form = new FormData(event.currentTarget);
			const result = await mailflareClient.mailboxes.create({
				domainId,
				localPart: String(form.get("localPart")),
				displayName: String(form.get("displayName") || "") || undefined,
			});
			setMailboxAddress(result.email);
			setStep("complete");
		});
	}
	if (step === "domain")
		return (
			<main className="page-shell narrow">
				<p className="eyebrow">Step 2 of 3</p>
				<h1>Add your domain</h1>
				<p>Connect a domain that Cloudflare Email Routing will deliver to Mailflare.</p>
				<form className="card" onSubmit={domain}>
					<label>
						Domain
						<input name="hostname" placeholder="example.com" required />
					</label>
					{error && <p role="alert">{error}</p>}
					<button className="button primary" type="submit" disabled={pending}>
						{pending ? "Connecting…" : "Connect domain"}
					</button>
				</form>
			</main>
		);
	if (step === "mailbox")
		return (
			<main className="page-shell narrow">
				<p className="eyebrow">Step 3 of 3</p>
				<h1>Create your mailbox</h1>
				<p>Choose the first address for {domainName}.</p>
				<form className="card" onSubmit={mailbox}>
					<label>
						Address
						<input name="localPart" placeholder="inbox" pattern="[A-Za-z0-9._%+-]+" required />
					</label>
					<label>
						Display name
						<input name="displayName" placeholder="My inbox" />
					</label>
					{error && <p role="alert">{error}</p>}
					<button className="button primary" type="submit" disabled={pending}>
						{pending ? "Creating mailbox…" : "Create mailbox"}
					</button>
				</form>
			</main>
		);
	if (step === "complete")
		return (
			<main className="page-shell narrow">
				<p className="eyebrow">Setup complete</p>
				<h1>Welcome to Mailflare</h1>
				<section className="card">
					<h2>{mailboxAddress}</h2>
					<p>Your first mailbox is ready to receive and send email.</p>
					<Link className="button primary" to="/inbox">
						Open inbox
					</Link>
				</section>
			</main>
		);
	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Step 1 of 3</p>
			<h1>Set up Mailflare</h1>
			<p>Create the first administrator for this fresh installation.</p>
			<form className="card" onSubmit={administrator}>
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
					{pending ? "Creating administrator…" : "Create administrator"}
				</button>
				<Link to="/login">Already configured? Sign in</Link>
			</form>
		</main>
	);
}

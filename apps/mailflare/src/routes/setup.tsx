import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

type SetupStep = "administrator" | "domain" | "mailbox" | "complete";

type RpcResult<T> = {
	json?: T;
	message?: string;
	error?: { message?: string };
};

export const Route = createFileRoute("/setup")({ component: SetupPage });

async function postRpc<T>(path: string, data: unknown): Promise<T> {
	const response = await fetch(`/api/rpc/${path}`, {
		method: "POST",
		credentials: "same-origin",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ json: data }),
	});
	const result = (await response.json()) as RpcResult<T>;
	if (!response.ok)
		throw new Error(result.error?.message ?? result.message ?? "Setup request failed.");
	if (result.json === undefined) throw new Error("Setup returned no result.");
	return result.json;
}

function SetupPage() {
	const [step, setStep] = useState<SetupStep>("administrator");
	const [domainId, setDomainId] = useState("");
	const [domainName, setDomainName] = useState("");
	const [mailboxAddress, setMailboxAddress] = useState("");
	const [error, setError] = useState<string>();
	const [pending, setPending] = useState(false);

	async function submitAdministrator(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		await submitStep(async () => {
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
			if (!response.ok) throw new Error(result.error ?? "Unable to complete setup.");
			setStep("domain");
		});
	}

	async function submitDomain(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		await submitStep(async () => {
			const form = new FormData(event.currentTarget);
			const result = await postRpc<{ id: string; hostname: string }>("domains/add", {
				hostname: form.get("hostname"),
			});
			setDomainId(result.id);
			setDomainName(result.hostname);
			setStep("mailbox");
		});
	}

	async function submitMailbox(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		await submitStep(async () => {
			const form = new FormData(event.currentTarget);
			const result = await postRpc<{ email: string }>("mailboxes/create", {
				domainId,
				localPart: form.get("localPart"),
				displayName: form.get("displayName"),
			});
			setMailboxAddress(result.email);
			setStep("complete");
		});
	}

	async function submitStep(action: () => Promise<void>) {
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

	if (step === "domain") {
		return (
			<main className="page-shell narrow">
				<p className="eyebrow">Step 2 of 3</p>
				<h1>Add your domain</h1>
				<p>Connect a domain that Cloudflare Email Routing will deliver to Mailflare.</p>
				<form className="card" onSubmit={submitDomain}>
					<label>
						Domain
						<input
							name="hostname"
							type="text"
							placeholder="example.com"
							autoComplete="url"
							required
						/>
					</label>
					{error && <p role="alert">{error}</p>}
					<button className="button primary" type="submit" disabled={pending}>
						{pending ? "Connecting…" : "Connect domain"}
					</button>
				</form>
			</main>
		);
	}

	if (step === "mailbox") {
		return (
			<main className="page-shell narrow">
				<p className="eyebrow">Step 3 of 3</p>
				<h1>Create your mailbox</h1>
				<p>Choose the first address for {domainName}.</p>
				<form className="card" onSubmit={submitMailbox}>
					<label>
						Address
						<input
							name="localPart"
							type="text"
							placeholder="inbox"
							pattern="[A-Za-z0-9._%+-]+"
							required
						/>
					</label>
					<label>
						Display name
						<input name="displayName" type="text" placeholder="My inbox" />
					</label>
					{error && <p role="alert">{error}</p>}
					<button className="button primary" type="submit" disabled={pending}>
						{pending ? "Creating mailbox…" : "Create mailbox"}
					</button>
				</form>
			</main>
		);
	}

	if (step === "complete") {
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
	}

	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Step 1 of 3</p>
			<h1>Set up Mailflare</h1>
			<p>Create the first administrator for this fresh installation.</p>
			<form className="card" onSubmit={submitAdministrator}>
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

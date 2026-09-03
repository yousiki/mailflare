import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

type Domain = { id: string; hostname: string; status: "pending" | "active" | "error" };
type Mailbox = { id: string; email: string; name: string };
type RpcResult<T> = { json?: T; message?: string; error?: { message?: string } };

export const Route = createFileRoute("/admin/mailboxes")({ component: MailboxesPage });

async function postRpc<T>(path: string, input: unknown): Promise<T> {
	const response = await fetch(`/api/rpc/${path}`, {
		method: "POST",
		credentials: "same-origin",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ json: input }),
	});
	const result = (await response.json()) as RpcResult<T>;
	if (!response.ok || result.json === undefined)
		throw new Error(result.error?.message ?? result.message ?? "Request failed.");
	return result.json;
}

function MailboxesPage() {
	const [domains, setDomains] = useState<Domain[]>();
	const [mailboxes, setMailboxes] = useState<Mailbox[]>();
	const [domainId, setDomainId] = useState("");
	const [localPart, setLocalPart] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [error, setError] = useState<string>();
	const [pending, setPending] = useState(false);

	useEffect(() => {
		Promise.all([postRpc<Domain[]>("domains/list", {}), postRpc<Mailbox[]>("mailboxes/list", {})])
			.then(([domainItems, mailboxItems]) => {
				setDomains(domainItems);
				setDomainId(domainItems[0]?.id ?? "");
				setMailboxes(mailboxItems);
			})
			.catch((cause: unknown) =>
				setError(cause instanceof Error ? cause.message : "Unable to load mailboxes."),
			);
	}, []);

	async function createMailbox(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(undefined);
		setPending(true);
		try {
			const mailbox = await postRpc<Mailbox>("mailboxes/create", {
				domainId,
				localPart,
				displayName,
			});
			setMailboxes((current) => [...(current ?? []), mailbox]);
			setLocalPart("");
			setDisplayName("");
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Unable to create mailbox.");
		} finally {
			setPending(false);
		}
	}

	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Administration</p>
			<h1>Mailboxes</h1>
			<form className="card" onSubmit={createMailbox}>
				<label>
					Domain
					<select value={domainId} onChange={(event) => setDomainId(event.target.value)} required>
						<option value="">Select a domain</option>
						{domains?.map((domain) => (
							<option value={domain.id} key={domain.id}>
								{domain.hostname}
							</option>
						))}
					</select>
				</label>
				<label>
					Address
					<input
						value={localPart}
						onChange={(event) => setLocalPart(event.target.value)}
						placeholder="inbox"
						pattern="[A-Za-z0-9._%+-]+"
						required
					/>
				</label>
				<label>
					Display name
					<input
						value={displayName}
						onChange={(event) => setDisplayName(event.target.value)}
						placeholder="My inbox"
					/>
				</label>
				{error && <p role="alert">{error}</p>}
				<button className="button primary" type="submit" disabled={pending || !domainId}>
					{pending ? "Creating…" : "Create mailbox"}
				</button>
			</form>
			<section className="feature-grid" aria-label="Mailboxes">
				{mailboxes?.map((mailbox) => (
					<article className="card" key={mailbox.id}>
						<h2>{mailbox.name}</h2>
						<p>{mailbox.email}</p>
					</article>
				))}
			</section>
		</main>
	);
}

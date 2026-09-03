import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { orpc } from "~/client/orpc";

export const Route = createFileRoute("/admin/mailboxes")({ component: MailboxesPage });

function MailboxesPage() {
	const [domainId, setDomainId] = useState("");
	const [localPart, setLocalPart] = useState("");
	const [displayName, setDisplayName] = useState("");
	const domains = useQuery(orpc.domains.list.queryOptions({ input: {} }));
	const mailboxes = useQuery(orpc.mailboxes.list.queryOptions({ input: {} }));
	const createMailbox = useMutation(
		orpc.mailboxes.create.mutationOptions({
			onSuccess: () => {
				setLocalPart("");
				setDisplayName("");
				void mailboxes.refetch();
			},
		}),
	);
	useEffect(() => {
		if (!domainId && domains.data?.[0]) setDomainId(domains.data[0].id);
	}, [domainId, domains.data]);
	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		createMailbox.mutate({ domainId, localPart, displayName: displayName || undefined });
	}
	const error = domains.error || mailboxes.error || createMailbox.error;

	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Administration</p>
			<h1>Mailboxes</h1>
			<form className="card" onSubmit={submit}>
				<label>
					Domain
					<select value={domainId} onChange={(event) => setDomainId(event.target.value)} required>
						<option value="">Select a domain</option>
						{domains.data?.map((domain) => (
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
				{error && <p role="alert">{error.message}</p>}
				<button
					className="button primary"
					type="submit"
					disabled={createMailbox.isPending || !domainId}
				>
					{createMailbox.isPending ? "Creating…" : "Create mailbox"}
				</button>
			</form>
			<section className="feature-grid" aria-label="Mailboxes">
				{mailboxes.data?.map((mailbox) => (
					<article className="card" key={mailbox.id}>
						<h2>{mailbox.name}</h2>
						<p>{mailbox.email}</p>
					</article>
				))}
			</section>
		</main>
	);
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type Contact = {
	id: string;
	email: string;
	displayName: string | null;
	blocked: boolean;
	lastSeenAt: string | null;
};
type RpcResult<T> = { json?: T; message?: string };

export const Route = createFileRoute("/contacts")({ component: ContactsPage });

function ContactsPage() {
	const [contacts, setContacts] = useState<Contact[]>();
	const [error, setError] = useState<string>();

	useEffect(() => {
		fetch("/api/rpc/contacts/list", {
			method: "POST",
			credentials: "same-origin",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ json: {} }),
		})
			.then(async (response) => {
				const result = (await response.json()) as RpcResult<Contact[]>;
				if (!response.ok || result.json === undefined)
					throw new Error(result.message ?? "Unable to load contacts.");
				setContacts(result.json);
			})
			.catch((cause: unknown) =>
				setError(cause instanceof Error ? cause.message : "Unable to load contacts."),
			);
	}, []);

	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Address book</p>
			<h1>Contacts</h1>
			{error && <p role="alert">{error}</p>}
			{contacts?.length ? (
				<section className="card message-list" aria-label="Contacts">
					{contacts.map((contact) => (
						<article className="message-row" key={contact.id}>
							<div>
								<h2>{contact.displayName ?? contact.email}</h2>
								<p>{contact.email}</p>
							</div>
							<span>{contact.blocked ? "Blocked" : "Available"}</span>
						</article>
					))}
				</section>
			) : (
				<section className="card empty-state">
					<h2>No contacts</h2>
					<p>Contacts are added when you exchange messages.</p>
				</section>
			)}
		</main>
	);
}

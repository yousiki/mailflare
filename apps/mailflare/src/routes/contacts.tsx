import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { orpc } from "~/client/orpc";

export const Route = createFileRoute("/contacts")({ component: ContactsPage });

function ContactsPage() {
	const contacts = useQuery(orpc.contacts.list.queryOptions({ input: {} }));

	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Address book</p>
			<h1>Contacts</h1>
			{contacts.error && <p role="alert">{contacts.error.message}</p>}
			{contacts.data?.length ? (
				<section className="card message-list" aria-label="Contacts">
					{contacts.data.map((contact) => (
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
					<h2>{contacts.isPending ? "Loading contacts…" : "No contacts"}</h2>
					<p>{contacts.isPending ? "" : "Contacts are added when you exchange messages."}</p>
				</section>
			)}
		</main>
	);
}

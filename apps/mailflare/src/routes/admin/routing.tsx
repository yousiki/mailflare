import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { orpc } from "~/client/orpc";

export const Route = createFileRoute("/admin/routing")({ component: RoutingPage });

function RoutingPage() {
	const mailboxes = useQuery(orpc.mailboxes.list.queryOptions({ input: {} }));
	const [mailboxId, setMailboxId] = useState("");
	const rules = useQuery({
		...orpc.routingRules.list.queryOptions({ input: { mailboxId } }),
		enabled: Boolean(mailboxId),
	});
	useEffect(() => {
		if (!mailboxId && mailboxes.data?.[0]) setMailboxId(mailboxes.data[0].id);
	}, [mailboxId, mailboxes.data]);
	const error = mailboxes.error || rules.error;
	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Administration</p>
			<h1>Routing rules</h1>
			<section className="card">
				<label>
					Mailbox
					<select value={mailboxId} onChange={(event) => setMailboxId(event.target.value)}>
						<option value="">Select a mailbox</option>
						{mailboxes.data?.map((mailbox) => (
							<option value={mailbox.id} key={mailbox.id}>
								{mailbox.email}
							</option>
						))}
					</select>
				</label>
			</section>
			{error && <p role="alert">{error.message}</p>}
			{rules.data?.length ? (
				<section className="card message-list" aria-label="Routing rules">
					{rules.data.map((rule) => (
						<article className="message-row" key={rule.id}>
							<div>
								<h2>{rule.matchValue}</h2>
								<p>
									{rule.matchField} {rule.matchOperator} → {rule.action}
								</p>
							</div>
							<span>Priority {rule.priority}</span>
						</article>
					))}
				</section>
			) : (
				<section className="card empty-state">
					<h2>{rules.isPending ? "Loading rules…" : "No routing rules"}</h2>
					<p>{rules.isPending ? "" : "Rules can route incoming messages to folders or spam."}</p>
				</section>
			)}
		</main>
	);
}

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { orpc } from "~/client/orpc";

export const Route = createFileRoute("/admin/accounts")({ component: AccountsPage });

function AccountsPage() {
	const accounts = useQuery(orpc.admin.users.queryOptions({ input: {} }));
	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Administration</p>
			<h1>Accounts</h1>
			{accounts.error && <p role="alert">{accounts.error.message}</p>}
			{accounts.data?.length ? (
				<section className="card message-list" aria-label="User accounts">
					{accounts.data.map((account) => (
						<article className="message-row" key={account.id}>
							<div>
								<h2>{account.name}</h2>
								<p>{account.email}</p>
							</div>
							<span>{account.disabled ? "Disabled" : account.role}</span>
						</article>
					))}
				</section>
			) : (
				<section className="card empty-state">
					<h2>{accounts.isPending ? "Loading accounts…" : "No accounts"}</h2>
					<p>{accounts.isPending ? "" : "Create the first administrator from setup."}</p>
				</section>
			)}
		</main>
	);
}

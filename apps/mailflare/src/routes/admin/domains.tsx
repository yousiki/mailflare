import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { orpc } from "~/client/orpc";

export const Route = createFileRoute("/admin/domains")({ component: DomainsPage });

function DomainsPage() {
	const [hostname, setHostname] = useState("");
	const domains = useQuery(orpc.domains.list.queryOptions({ input: {} }));
	const addDomain = useMutation(
		orpc.domains.add.mutationOptions({
			onSuccess: () => {
				setHostname("");
				void domains.refetch();
			},
		}),
	);
	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		addDomain.mutate({ hostname });
	}

	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Administration</p>
			<h1>Domains</h1>
			<form className="card" onSubmit={submit}>
				<label>
					Add a domain
					<input
						value={hostname}
						onChange={(event) => setHostname(event.target.value)}
						placeholder="example.com"
						required
					/>
				</label>
				{(domains.error || addDomain.error) && (
					<p role="alert">{(domains.error || addDomain.error)?.message}</p>
				)}
				<button className="button primary" type="submit" disabled={addDomain.isPending}>
					{addDomain.isPending ? "Connecting…" : "Connect domain"}
				</button>
			</form>
			<section className="feature-grid" aria-label="Connected domains">
				{domains.data?.map((domain) => (
					<article className="card" key={domain.id}>
						<h2>{domain.hostname}</h2>
						<p>Status: {domain.status}</p>
					</article>
				))}
			</section>
		</main>
	);
}

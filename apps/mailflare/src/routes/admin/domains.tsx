import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

type Domain = { id: string; hostname: string; status: "pending" | "active" | "error" };
type RpcResult<T> = { json?: T; message?: string; error?: { message?: string } };

export const Route = createFileRoute("/admin/domains")({ component: DomainsPage });

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

function DomainsPage() {
	const [domains, setDomains] = useState<Domain[]>();
	const [hostname, setHostname] = useState("");
	const [error, setError] = useState<string>();
	const [pending, setPending] = useState(false);

	useEffect(() => {
		postRpc<Domain[]>("domains/list", {})
			.then(setDomains)
			.catch((cause: unknown) =>
				setError(cause instanceof Error ? cause.message : "Unable to load domains."),
			);
	}, []);

	async function addDomain(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(undefined);
		setPending(true);
		try {
			const domain = await postRpc<Domain>("domains/add", { hostname });
			setDomains((current) => [...(current ?? []), domain]);
			setHostname("");
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Unable to connect domain.");
		} finally {
			setPending(false);
		}
	}

	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Administration</p>
			<h1>Domains</h1>
			<form className="card" onSubmit={addDomain}>
				<label>
					Add a domain
					<input
						value={hostname}
						onChange={(event) => setHostname(event.target.value)}
						placeholder="example.com"
						required
					/>
				</label>
				{error && <p role="alert">{error}</p>}
				<button className="button primary" type="submit" disabled={pending}>
					{pending ? "Connecting…" : "Connect domain"}
				</button>
			</form>
			<section className="feature-grid" aria-label="Connected domains">
				{domains?.map((domain) => (
					<article className="card" key={domain.id}>
						<h2>{domain.hostname}</h2>
						<p>Status: {domain.status}</p>
					</article>
				))}
			</section>
		</main>
	);
}

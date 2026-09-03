import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { orpc } from "~/client/orpc";

export const Route = createFileRoute("/admin/api-keys")({ component: ApiKeysPage });

function ApiKeysPage() {
	const [name, setName] = useState("");
	const [key, setKey] = useState<string>();
	const keys = useQuery(orpc.apiKeys.list.queryOptions({ input: {} }));
	const create = useMutation(
		orpc.apiKeys.create.mutationOptions({
			onSuccess: (result) => {
				setKey(result.key);
				setName("");
				void keys.refetch();
			},
		}),
	);
	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		create.mutate({ name, scopes: ["read", "send"] });
	}
	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Administration</p>
			<h1>API keys</h1>
			<form className="card" onSubmit={submit}>
				<label>
					Name
					<input value={name} onChange={(event) => setName(event.target.value)} required />
				</label>
				{(keys.error || create.error) && (
					<p role="alert">{(keys.error || create.error)?.message}</p>
				)}
				<button className="button primary" type="submit" disabled={create.isPending}>
					{create.isPending ? "Creating…" : "Create API key"}
				</button>
				{key && (
					<p role="status">
						<strong>Copy this key now:</strong> <code>{key}</code>
					</p>
				)}
			</form>
			{keys.data?.length ? (
				<section className="card message-list" aria-label="API keys">
					{keys.data.map((item) => (
						<article className="message-row" key={item.id}>
							<div>
								<h2>{item.name}</h2>
								<p>
									{item.prefix} · {item.scopes}
								</p>
							</div>
							<time dateTime={item.createdAt.toISOString()}>{item.createdAt.toLocaleString()}</time>
						</article>
					))}
				</section>
			) : (
				<section className="card empty-state">
					<h2>{keys.isPending ? "Loading API keys…" : "No API keys"}</h2>
					<p>{keys.isPending ? "" : "Create a key for an external integration."}</p>
				</section>
			)}
		</main>
	);
}

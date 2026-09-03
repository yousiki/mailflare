import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { orpc } from "~/client/orpc";

export const Route = createFileRoute("/admin/webhooks")({ component: WebhooksPage });

function WebhooksPage() {
	const [url, setUrl] = useState("");
	const [secret, setSecret] = useState<string>();
	const hooks = useQuery(orpc.admin.webhooks.list.queryOptions({ input: {} }));
	const create = useMutation(
		orpc.admin.webhooks.create.mutationOptions({
			onSuccess: (result) => {
				setSecret(result.secret);
				setUrl("");
				void hooks.refetch();
			},
		}),
	);
	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		create.mutate({ url, events: ["message.received", "message.sent"] });
	}
	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Administration</p>
			<h1>Webhooks</h1>
			<form className="card" onSubmit={submit}>
				<label>
					Endpoint URL
					<input
						type="url"
						value={url}
						onChange={(event) => setUrl(event.target.value)}
						placeholder="https://example.com/mailflare"
						required
					/>
				</label>
				{(hooks.error || create.error) && (
					<p role="alert">{(hooks.error || create.error)?.message}</p>
				)}
				<button className="button primary" type="submit" disabled={create.isPending}>
					{create.isPending ? "Creating…" : "Add webhook"}
				</button>
				{secret && (
					<p role="status">
						<strong>Save this signing secret:</strong> <code>{secret}</code>
					</p>
				)}
			</form>
			{hooks.data?.length ? (
				<section className="card message-list" aria-label="Webhooks">
					{hooks.data.map((hook) => (
						<article className="message-row" key={hook.id}>
							<div>
								<h2>{hook.url}</h2>
								<p>{hook.events}</p>
							</div>
							<span>{hook.enabled ? "Enabled" : "Disabled"}</span>
						</article>
					))}
				</section>
			) : (
				<section className="card empty-state">
					<h2>{hooks.isPending ? "Loading webhooks…" : "No webhooks"}</h2>
					<p>{hooks.isPending ? "" : "Add a webhook to receive Mailflare events."}</p>
				</section>
			)}
		</main>
	);
}

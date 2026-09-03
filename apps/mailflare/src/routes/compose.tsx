import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

type MailboxSummary = { id: string; email: string; name: string };

export const Route = createFileRoute("/compose")({ component: ComposePage });

async function loadMailboxes(): Promise<MailboxSummary[]> {
	const response = await fetch("/api/rpc/mailboxes/list", {
		method: "POST",
		credentials: "same-origin",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ json: {} }),
	});
	if (!response.ok) throw new Error("Unable to load mailboxes.");
	const payload = (await response.json()) as { json: MailboxSummary[] };
	return payload.json;
}

function ComposePage() {
	const [mailboxes, setMailboxes] = useState<MailboxSummary[]>();
	const [mailboxId, setMailboxId] = useState("");
	const [error, setError] = useState<string>();
	const [sent, setSent] = useState(false);
	const [pending, setPending] = useState(false);

	useEffect(() => {
		loadMailboxes()
			.then((items) => {
				setMailboxes(items);
				setMailboxId(items[0]?.id ?? "");
			})
			.catch((cause: unknown) =>
				setError(cause instanceof Error ? cause.message : "Unable to load mailboxes."),
			);
	}, []);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(undefined);
		setSent(false);
		setPending(true);
		const form = new FormData(event.currentTarget);
		const mailbox = mailboxes?.find((item) => item.id === mailboxId);
		try {
			const response = await fetch("/api/rpc/messages/send", {
				method: "POST",
				credentials: "same-origin",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					json: {
						mailboxId,
						from: mailbox?.email,
						to: form.get("to"),
						subject: form.get("subject"),
						text: form.get("body"),
					},
				}),
			});
			const result = (await response.json()) as { json?: { messageId: string }; message?: string };
			if (!response.ok) throw new Error(result.message ?? "Unable to send message.");
			setSent(Boolean(result.json?.messageId));
			event.currentTarget.reset();
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Unable to send message.");
		} finally {
			setPending(false);
		}
	}

	return (
		<main className="page-shell narrow">
			<h1>Compose</h1>
			<form className="card" onSubmit={handleSubmit}>
				<label>
					From
					<select value={mailboxId} onChange={(event) => setMailboxId(event.target.value)} required>
						<option value="">Select a mailbox</option>
						{mailboxes?.map((mailbox) => (
							<option value={mailbox.id} key={mailbox.id}>
								{mailbox.email}
							</option>
						))}
					</select>
				</label>
				<label>
					To
					<input name="to" type="email" required />
				</label>
				<label>
					Subject
					<input name="subject" required />
				</label>
				<label>
					Message
					<textarea name="body" rows={8} required />
				</label>
				{error && <p role="alert">{error}</p>}
				{sent && <p role="status">Message sent.</p>}
				<button className="button primary" type="submit" disabled={pending || !mailboxId}>
					{pending ? "Sending…" : "Send message"}
				</button>
			</form>
		</main>
	);
}

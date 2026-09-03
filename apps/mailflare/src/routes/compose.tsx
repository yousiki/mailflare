import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { orpc } from "~/client/orpc";

export const Route = createFileRoute("/compose")({ component: ComposePage });

function ComposePage() {
	const [mailboxId, setMailboxId] = useState("");
	const [sent, setSent] = useState(false);
	const mailboxes = useQuery(orpc.mailboxes.list.queryOptions({ input: {} }));
	const send = useMutation(orpc.messages.send.mutationOptions({ onSuccess: () => setSent(true) }));
	const selectedMailbox = mailboxes.data?.find((mailbox) => mailbox.id === mailboxId);
	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSent(false);
		const form = new FormData(event.currentTarget);
		if (!selectedMailbox) return;
		send.mutate({
			mailboxId,
			from: selectedMailbox.email,
			to: String(form.get("to")),
			subject: String(form.get("subject")),
			text: String(form.get("body")),
		});
		if (!send.isError) event.currentTarget.reset();
	}
	const error = mailboxes.error || send.error;

	return (
		<main className="page-shell narrow">
			<h1>Compose</h1>
			<form className="card" onSubmit={submit}>
				<label>
					From
					<select value={mailboxId} onChange={(event) => setMailboxId(event.target.value)} required>
						<option value="">Select a mailbox</option>
						{mailboxes.data?.map((mailbox) => (
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
				{error && <p role="alert">{error.message}</p>}
				{sent && <p role="status">Message sent.</p>}
				<button className="button primary" type="submit" disabled={send.isPending || !mailboxId}>
					{send.isPending ? "Sending…" : "Send message"}
				</button>
			</form>
		</main>
	);
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type Folder = { id: string; mailboxId: string; name: string; color: string };
type RpcResult<T> = { json?: T; message?: string };

export const Route = createFileRoute("/folders")({ component: FoldersPage });

function FoldersPage() {
	const [folders, setFolders] = useState<Folder[]>();
	const [error, setError] = useState<string>();

	useEffect(() => {
		fetch("/api/rpc/folders/list", {
			method: "POST",
			credentials: "same-origin",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ json: {} }),
		})
			.then(async (response) => {
				const result = (await response.json()) as RpcResult<Folder[]>;
				if (!response.ok || result.json === undefined)
					throw new Error(result.message ?? "Unable to load folders.");
				setFolders(result.json);
			})
			.catch((cause: unknown) =>
				setError(cause instanceof Error ? cause.message : "Unable to load folders."),
			);
	}, []);

	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Mailbox organization</p>
			<h1>Folders</h1>
			{error && <p role="alert">{error}</p>}
			{folders?.length ? (
				<section className="feature-grid" aria-label="Folders">
					{folders.map((folder) => (
						<article className="card" key={folder.id}>
							<h2 style={{ color: folder.color }}>{folder.name}</h2>
							<p>Mailbox folder</p>
						</article>
					))}
				</section>
			) : (
				<section className="card empty-state">
					<h2>No custom folders</h2>
					<p>Create folders from your inbox when you need them.</p>
				</section>
			)}
		</main>
	);
}

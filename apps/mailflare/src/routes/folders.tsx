import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { orpc } from "~/client/orpc";

export const Route = createFileRoute("/folders")({ component: FoldersPage });

function FoldersPage() {
	const folders = useQuery(orpc.folders.list.queryOptions({ input: {} }));

	return (
		<main className="page-shell narrow">
			<p className="eyebrow">Mailbox organization</p>
			<h1>Folders</h1>
			{folders.error && <p role="alert">{folders.error.message}</p>}
			{folders.data?.length ? (
				<section className="feature-grid" aria-label="Folders">
					{folders.data.map((folder) => (
						<article className="card" key={folder.id}>
							<h2 style={{ color: folder.color }}>{folder.name}</h2>
							<p>Mailbox folder</p>
						</article>
					))}
				</section>
			) : (
				<section className="card empty-state">
					<h2>{folders.isPending ? "Loading folders…" : "No custom folders"}</h2>
					<p>{folders.isPending ? "" : "Create folders from your inbox when you need them."}</p>
				</section>
			)}
		</main>
	);
}

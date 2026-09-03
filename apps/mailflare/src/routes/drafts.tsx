import { createFileRoute } from "@tanstack/react-router";
import { MessageFolderPage } from "~/components/message-folder-page";

export const Route = createFileRoute("/drafts")({
	component: () => (
		<MessageFolderPage
			folder="drafts"
			title="Drafts"
			description="Messages you have saved for later."
		/>
	),
});

import { createFileRoute } from "@tanstack/react-router";
import { MessageFolderPage } from "~/components/message-folder-page";

export const Route = createFileRoute("/archived")({
	component: () => (
		<MessageFolderPage
			folder="archived"
			title="Archived"
			description="Messages removed from your inbox."
		/>
	),
});

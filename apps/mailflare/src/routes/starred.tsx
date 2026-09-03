import { createFileRoute } from "@tanstack/react-router";
import { MessageFolderPage } from "~/components/message-folder-page";

export const Route = createFileRoute("/starred")({
	component: () => (
		<MessageFolderPage
			folder="starred"
			title="Starred"
			description="Messages you marked as important."
		/>
	),
});

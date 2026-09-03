import { createFileRoute } from "@tanstack/react-router";
import { MessageFolderPage } from "~/components/message-folder-page";

export const Route = createFileRoute("/snoozed")({
	component: () => (
		<MessageFolderPage
			folder="snoozed"
			title="Snoozed"
			description="Messages waiting for a later time."
		/>
	),
});

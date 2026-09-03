import { createFileRoute } from "@tanstack/react-router";
import { MessageFolderPage } from "~/components/message-folder-page";

export const Route = createFileRoute("/trash")({
	component: () => (
		<MessageFolderPage folder="trash" title="Trash" description="Messages marked for deletion." />
	),
});

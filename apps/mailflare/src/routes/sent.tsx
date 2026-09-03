import { createFileRoute } from "@tanstack/react-router";
import { MessageFolderPage } from "~/components/message-folder-page";

export const Route = createFileRoute("/sent")({
	component: () => (
		<MessageFolderPage folder="sent" title="Sent" description="Messages you have sent." />
	),
});

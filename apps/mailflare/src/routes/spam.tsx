import { createFileRoute } from "@tanstack/react-router";
import { MessageFolderPage } from "~/components/message-folder-page";

export const Route = createFileRoute("/spam")({
	component: () => (
		<MessageFolderPage folder="spam" title="Spam" description="Messages identified as unwanted." />
	),
});

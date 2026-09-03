import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/inbox")({ component: InboxLayout });

function InboxLayout() {
	return <Outlet />;
}

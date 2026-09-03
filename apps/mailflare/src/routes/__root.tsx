import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "../styles/app.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Mailflare" },
			{ name: "description", content: "Self-hosted email on Cloudflare" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	shellComponent: RootDocument,
	component: () => <Outlet />,
});

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<header className="site-header">
					<Link to="/" className="brand">
						Mailflare
					</Link>
					<nav aria-label="Primary navigation">
						<Link to="/login">Login</Link>
						<Link to="/setup">Setup</Link>
					</nav>
				</header>
				{children}
				<Scripts />
			</body>
		</html>
	);
}

import { RPCHandler } from "@orpc/server/fetch";
import { createFileRoute } from "@tanstack/react-router";
import { rpcRouter } from "~/server/rpc";

const handler = new RPCHandler(rpcRouter);

async function handle(request: Request): Promise<Response> {
	const result = await handler.handle(request);
	if (result.matched) return result.response;
	return new Response("Not Found", { status: 404 });
}

export const Route = createFileRoute("/api/rpc")({
	server: {
		handlers: {
			GET: ({ request }) => handle(request),
			POST: ({ request }) => handle(request),
		},
	},
});

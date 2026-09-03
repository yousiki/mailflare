import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { RouterClient } from "@orpc/server";
import type { MailflareRpcRouter } from "~/server/rpc";

const link = new RPCLink({
	url: "/api/rpc",
	fetch: (request, init) => fetch(request, { ...init, credentials: "include" }),
});

export const mailflareClient = createORPCClient<RouterClient<MailflareRpcRouter>>(link);
export const orpc = createTanstackQueryUtils(mailflareClient);

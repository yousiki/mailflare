import { RPCHandler } from "@orpc/server/fetch";
import { describe, expect, it } from "vitest";
import { rpcRouter, type MailflareRpcContext } from "./rpc";

const handler = new RPCHandler(rpcRouter);

describe("oRPC gateway", () => {
	it("serves the health procedure beneath the API prefix", async () => {
		const request = new Request("http://mailflare/api/rpc/health", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ json: {} }),
		});
		const result = await handler.handle(request, {
			prefix: "/api/rpc",
			context: { env: {} as CloudflareEnv, request } satisfies MailflareRpcContext,
		});
		expect(result.matched).toBe(true);
		if (result.matched) {
			expect(result.response.status).toBe(200);
			expect(await result.response.json()).toMatchObject({
				json: { service: "mailflare", status: "ok" },
			});
		}
	});
});

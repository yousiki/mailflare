import { describe, expect, it } from "vitest";
import { app } from "./app";

describe("Hono gateway", () => {
	it("exposes a deterministic health response", async () => {
		const response = await app.request("http://mailflare/api/health");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ service: "mailflare", status: "ok" });
	});
});

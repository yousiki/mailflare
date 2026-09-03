import { describe, expect, it } from "vitest";
import { isSameOriginRequest, rejectCrossOriginMutation } from "./request-security";

describe("request origin policy", () => {
	it("accepts same-origin mutations", () => {
		const request = new Request("https://mail.example/api/rpc/messages/send", {
			method: "POST",
			headers: { origin: "https://mail.example" },
		});
		expect(isSameOriginRequest(request)).toBe(true);
		expect(rejectCrossOriginMutation(request)).toBeUndefined();
	});

	it("rejects cross-origin mutations", () => {
		const request = new Request("https://mail.example/api/rpc/messages/send", {
			method: "POST",
			headers: { origin: "https://evil.example" },
		});
		expect(isSameOriginRequest(request)).toBe(false);
		expect(rejectCrossOriginMutation(request)?.status).toBe(403);
	});
});

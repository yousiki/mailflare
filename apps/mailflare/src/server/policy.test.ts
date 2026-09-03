import { describe, expect, it } from "vitest";
import { ORPCError } from "@orpc/server";
import { requirePermission } from "./policy";

describe("Mailflare authorization policy", () => {
	it("allows administrators to manage domains", () => {
		expect(() => requirePermission("admin", "domain.manage")).not.toThrow();
	});

	it("denies mailbox members administrative actions", () => {
		expect(() => requirePermission("member", "admin")).toThrowError(ORPCError);
	});
});

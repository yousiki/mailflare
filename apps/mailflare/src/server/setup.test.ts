import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { account } from "./auth-schema";

const alchemyMigration = readFileSync(
	new URL(
		"../../../../drizzle/alchemy-migrations/0024_add_better_auth_account_issuer.sql",
		import.meta.url,
	),
	"utf8",
);

describe("Better Auth account schema", () => {
	it("declares the issuer required by credential account linking", () => {
		expect(account.issuer).toBeDefined();
		expect(alchemyMigration).toContain(
			"ADD COLUMN issuer TEXT NOT NULL DEFAULT 'local:credential'",
		);
	});
});

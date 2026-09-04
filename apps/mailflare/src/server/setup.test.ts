import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

const { getDb } = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("../../../../src/db", () => ({ getDb }));

import { account } from "./auth-schema";
import { removeIncompleteAuthUser } from "./setup";

const alchemyMigration = readFileSync(
	new URL(
		"../../../../drizzle/alchemy-migrations/0024_add_better_auth_account_issuer.sql",
		import.meta.url,
	),
	"utf8",
);

function fakeDatabase(candidate: { id: string } | null, profile: { id: string } | null) {
	let selectCount = 0;
	const deleted: unknown[] = [];
	const database = {
		select() {
			const query = {
				from() {
					return query;
				},
				where() {
					return query;
				},
				limit: async () => {
					selectCount += 1;
					if (selectCount === 1) return candidate ? [candidate] : [];
					return profile ? [profile] : [];
				},
			};
			return query;
		},
		delete(table: unknown) {
			return { where: async () => deleted.push(table) };
		},
	};
	return { database, deleted };
}

describe("incomplete setup recovery", () => {
	it("removes only the orphan authentication records", async () => {
		const fake = fakeDatabase({ id: "orphan" }, null);
		getDb.mockReturnValue(fake.database);

		await expect(removeIncompleteAuthUser({} as CloudflareEnv, "Admin@Example.com")).resolves.toBe(
			true,
		);
		expect(fake.deleted).toHaveLength(4);
	});

	it("does not delete an authentication record with an application profile", async () => {
		const fake = fakeDatabase({ id: "live" }, { id: "live" });
		getDb.mockReturnValue(fake.database);

		await expect(removeIncompleteAuthUser({} as CloudflareEnv, "admin@example.com")).resolves.toBe(
			false,
		);
		expect(fake.deleted).toHaveLength(0);
	});
});

describe("Better Auth account schema", () => {
	it("declares the issuer required by credential account linking", () => {
		expect(account.issuer).toBeDefined();
		expect(alchemyMigration).toContain(
			"ADD COLUMN issuer TEXT NOT NULL DEFAULT 'local:credential'",
		);
	});
});

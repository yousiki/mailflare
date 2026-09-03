import { eq } from "drizzle-orm";
import { getDb } from "../../../../src/db";
import { domains } from "../../../../src/db/schema";
import { addDomainForUser } from "../../../../src/lib/domains/service";

export type DomainSummary = {
	id: string;
	hostname: string;
	status: "pending" | "active" | "error";
};

export async function listDomainsForUser(
	env: CloudflareEnv,
	userId: string,
): Promise<DomainSummary[]> {
	const rows = await getDb(env)
		.select({ id: domains.id, hostname: domains.hostname, status: domains.status })
		.from(domains)
		.where(eq(domains.userId, userId))
		.orderBy(domains.hostname);
	return rows;
}

export async function provisionDomainForUser(
	env: CloudflareEnv,
	userId: string,
	hostname: string,
): Promise<DomainSummary> {
	const result = await addDomainForUser(env, userId, hostname, {
		enableRouting: true,
		enableSending: true,
	});
	return {
		id: result.domain.id,
		hostname: result.domain.hostname,
		status: result.domain.status,
	};
}

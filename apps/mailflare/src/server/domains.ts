import { addDomainForUser } from "../../../../src/lib/domains/service";

export type DomainSummary = {
	id: string;
	hostname: string;
	status: "pending" | "active" | "error";
};

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

import { cfRequest } from "@/lib/cloudflare-api";
import type { CfEmailRoutingRule } from "@/lib/cloudflare-api.types";
import { getEmailWorkerName } from "@/lib/cloudflare-api-utils";

export async function ensureEmailRoutingCatchAllToWorker(
	env: CloudflareEnv,
	zoneId: string,
): Promise<CfEmailRoutingRule> {
	const workerName = getEmailWorkerName();
	return cfRequest<CfEmailRoutingRule>(
		env,
		`/zones/${zoneId}/email/routing/rules/catch_all`,
		{
			method: "PUT",
			body: JSON.stringify({
				actions: [{ type: "worker", value: [workerName] }],
				enabled: true,
				matchers: [{ type: "all" }],
				name: `Route all email to ${workerName}`,
			}),
		},
	);
}

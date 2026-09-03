import type { SetupRequirementCheck } from "./types";

export function getSetupRequirementChecks(env: CloudflareEnv): SetupRequirementCheck[] {
	const hasApiToken = !!env.CF_TOKEN?.trim();
	const hasGlobalKey = !!env.CF_API_KEY?.trim() && !!env.CF_EMAIL?.trim();

	return [
		{
			key: "Cloudflare API credentials",
			configured: hasApiToken || hasGlobalKey,
			message: "Set CF_TOKEN, or set both CF_API_KEY and CF_EMAIL.",
		},
		{
			key: "D1 database",
			configured: !!env.DB,
			message: "Deploy the Worker with the DB binding from wrangler.jsonc.",
		},
	];
}

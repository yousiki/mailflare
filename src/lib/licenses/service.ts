import type { LicenseEntitlements } from "./types";

// Self-hosted deployments include every feature implemented by this fork
// without representing an official upstream Pro or Team license.
const SELF_HOSTED_ENTITLEMENTS: LicenseEntitlements = {
	plan: "community",
	canCustomizeBranding: true,
	canManageAccounts: true,
	canForwardEmail: true,
};

export async function getLicenseEntitlements(_env: CloudflareEnv): Promise<LicenseEntitlements> {
	return { ...SELF_HOSTED_ENTITLEMENTS };
}

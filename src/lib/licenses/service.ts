import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { licenseSettings } from "@/db/schema";
import type { LicensePlan, LicenseEntitlements, LicenseStatus } from "./types";
import { parseFeatures } from "./utils";

const LICENSE_SETTINGS_ID = "default";
const SELF_HOSTED_LICENSE_ERROR = "License management is unavailable in self-hosted mode";

// Self-hosted deployments include the existing paid feature set without claiming
// an official Pro or Team license.
const SELF_HOSTED_ENTITLEMENTS: LicenseEntitlements = {
	plan: "community",
	canCustomizeBranding: true,
	canManageAccounts: true,
	canForwardEmail: true,
};

async function getOrCreateLicenseSettings(env: CloudflareEnv) {
	const db = getDb(env);
	await db
		.insert(licenseSettings)
		.values({ id: LICENSE_SETTINGS_ID, instanceId: crypto.randomUUID() })
		.onConflictDoNothing({ target: licenseSettings.id });
	const [settings] = await db
		.select()
		.from(licenseSettings)
		.where(eq(licenseSettings.id, LICENSE_SETTINGS_ID))
		.limit(1);
	if (!settings) throw new Error("Unable to initialize license settings");
	return settings;
}

function toLicenseStatus(settings: typeof licenseSettings.$inferSelect): LicenseStatus {
	const active = settings.state === "active" && (settings.plan === "pro" || settings.plan === "team");
	return {
		plan: active ? settings.plan : "community",
		state: settings.state,
		features: parseFeatures(settings.features),
		instanceId: settings.instanceId,
		instanceUrl: settings.instanceUrl,
		active,
		activatedAt: settings.activatedAt,
		validatedAt: settings.validatedAt,
	};
}

/**
 * Retained for callers that still expose the legacy license status shape.
 * Entitlement decisions must use getLicenseEntitlements instead.
 */
export async function getLicenseStatus(env: CloudflareEnv): Promise<LicenseStatus> {
	return toLicenseStatus(await getOrCreateLicenseSettings(env));
}

/**
 * Self-hosted mode unlocks all features implemented by this fork. The neutral
 * community plan intentionally avoids representing an official paid license.
 */
export async function getLicenseEntitlements(_env: CloudflareEnv): Promise<LicenseEntitlements> {
	return { ...SELF_HOSTED_ENTITLEMENTS };
}

/**
 * Keep the old action exports source-compatible while making sure a self-hosted
 * installation never sends license keys to a commercial service.
 */
export async function activateLicense(
	_env: CloudflareEnv,
	_licenseKey: string,
	_instanceUrl: string,
	_plan: Exclude<LicensePlan, "community">,
): Promise<LicenseStatus> {
	throw new Error(SELF_HOSTED_LICENSE_ERROR);
}

export async function validateLicense(
	_env: CloudflareEnv,
	_licenseKey: string,
	_instanceUrl: string,
): Promise<LicenseStatus> {
	throw new Error(SELF_HOSTED_LICENSE_ERROR);
}

export async function deactivateLicense(_env: CloudflareEnv): Promise<LicenseStatus> {
	throw new Error(SELF_HOSTED_LICENSE_ERROR);
}

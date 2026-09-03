export type LicensePlan = "community";

export type LicenseEntitlements = {
	plan: LicensePlan;
	canCustomizeBranding: boolean;
	canManageAccounts: boolean;
	canForwardEmail: boolean;
};

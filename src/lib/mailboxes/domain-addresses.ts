import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/db";
import { domains, mailboxes } from "@/db/schema";
import { deleteEmailRoutingRuleForAddress, ensureEmailRoutingRuleToWorker } from "@/lib/cloudflare-api";
import type { MailboxDomainAddressInput } from "./domain-addresses-types";

export async function getMailboxDomainAddresses(
	db: AppDatabase,
	mailbox: MailboxDomainAddressInput,
): Promise<string[]> {
	const [primaryDomain] = await db
		.select({ hostname: domains.hostname, userId: domains.userId })
		.from(domains)
		.where(eq(domains.id, mailbox.domainId))
		.limit(1);
	if (!primaryDomain) return [];

	const primaryAddress = `${mailbox.localPart}@${primaryDomain.hostname}`.toLowerCase();
	if (!mailbox.useAllDomains) return [primaryAddress];

	const availableDomains = await db
		.select({ id: domains.id, hostname: domains.hostname })
		.from(domains)
		.where(and(eq(domains.userId, primaryDomain.userId), eq(domains.status, "active")));
	const assignedMailboxes = await db
		.select({ id: mailboxes.id, domainId: mailboxes.domainId })
		.from(mailboxes)
		.where(eq(mailboxes.localPart, mailbox.localPart));
	const assignedDomainIds = new Set(
		assignedMailboxes.filter((item) => item.id !== mailbox.id).map((item) => item.domainId),
	);

	return [
		primaryAddress,
		...availableDomains
			.filter((domain) => domain.id !== mailbox.domainId && !assignedDomainIds.has(domain.id))
			.map((domain) => `${mailbox.localPart}@${domain.hostname}`.toLowerCase()),
	];
}

export async function ensureMailboxDomainRouting(
	env: CloudflareEnv,
	db: AppDatabase,
	mailbox: MailboxDomainAddressInput,
): Promise<void> {
	const addresses = await getMailboxDomainAddresses(db, mailbox);
	if (addresses.length === 0) return;
	const [primaryDomain] = await db
		.select({ userId: domains.userId })
		.from(domains)
		.where(eq(domains.id, mailbox.domainId))
		.limit(1);
	if (!primaryDomain) return;
	const availableDomains = await db
		.select({ hostname: domains.hostname, zoneId: domains.zoneId })
		.from(domains)
		.where(eq(domains.userId, primaryDomain.userId));
	const domainsByHostname = new Map(availableDomains.map((domain) => [domain.hostname.toLowerCase(), domain]));

	await Promise.all(
		addresses.map(async (address) => {
			const hostname = address.slice(address.lastIndexOf("@") + 1);
			const domain = domainsByHostname.get(hostname);
			if (domain) await ensureEmailRoutingRuleToWorker(env, domain.zoneId, address);
		}),
	);
}

export async function removeMailboxDomainRouting(
	env: CloudflareEnv,
	db: AppDatabase,
	mailbox: MailboxDomainAddressInput,
): Promise<void> {
	const addresses = await getMailboxDomainAddresses(db, mailbox);
	if (addresses.length === 0) return;
	const [primaryDomain] = await db
		.select({ userId: domains.userId })
		.from(domains)
		.where(eq(domains.id, mailbox.domainId))
		.limit(1);
	if (!primaryDomain) return;
	const availableDomains = await db
		.select({ hostname: domains.hostname, zoneId: domains.zoneId })
		.from(domains)
		.where(eq(domains.userId, primaryDomain.userId));
	const domainsByHostname = new Map(availableDomains.map((domain) => [domain.hostname.toLowerCase(), domain]));

	await Promise.all(
		addresses.map(async (address) => {
			const hostname = address.slice(address.lastIndexOf("@") + 1);
			const domain = domainsByHostname.get(hostname);
			if (domain) await deleteEmailRoutingRuleForAddress(env, domain.zoneId, address);
		}),
	);
}

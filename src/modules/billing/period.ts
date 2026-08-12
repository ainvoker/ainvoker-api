export const PRO_PREPAID_DAYS = 30
export const PRO_PREPAID_MS = PRO_PREPAID_DAYS * 24 * 60 * 60 * 1000

export function proPrepaidExpiresAt(from = new Date()): Date {
    return new Date(from.getTime() + PRO_PREPAID_MS)
}

/** Null expiry is grandfathered as still entitled. */
export function isEntitlementUnexpired(expiresAt: Date | null, now = new Date()): boolean {
    return expiresAt == null || expiresAt.getTime() > now.getTime()
}

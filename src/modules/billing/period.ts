/** Add one calendar month; day-of-month capped at 28 to match Xendit anchor rules. */
export function proRenewsAt(from = new Date()): Date {
    const year = from.getUTCFullYear()
    const month = from.getUTCMonth()
    const day = Math.min(from.getUTCDate(), 28)
    const hours = from.getUTCHours()
    const minutes = from.getUTCMinutes()
    const seconds = from.getUTCSeconds()
    const ms = from.getUTCMilliseconds()

    const nextMonth = month + 1
    return new Date(Date.UTC(year, nextMonth, day, hours, minutes, seconds, ms))
}

/** @deprecated Use proRenewsAt — kept for tests that assert monthly window length roughly. */
export const PRO_PREPAID_DAYS = 30
export const PRO_PREPAID_MS = PRO_PREPAID_DAYS * 24 * 60 * 60 * 1000

/** Alias for activation / renewal expiry. */
export function proPrepaidExpiresAt(from = new Date()): Date {
    return proRenewsAt(from)
}

/** Null expiry is grandfathered as still entitled. */
export function isEntitlementUnexpired(expiresAt: Date | null, now = new Date()): boolean {
    return expiresAt == null || expiresAt.getTime() > now.getTime()
}

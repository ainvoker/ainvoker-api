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

/** One calendar month before `end`, day clamped to the target month's length. */
export function proPeriodStartBefore(end: Date): Date {
    const year = end.getUTCFullYear()
    const month = end.getUTCMonth() - 1
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    return new Date(
        Date.UTC(
            year,
            month,
            Math.min(end.getUTCDate(), lastDay),
            end.getUTCHours(),
            end.getUTCMinutes(),
            end.getUTCSeconds(),
            end.getUTCMilliseconds(),
        ),
    )
}

export type QuotaPeriod = { periodStart: Date; periodEnd: Date }

type PeriodSubscription = {
    status: string
    startedAt: Date
    expiresAt: Date | null
}

/**
 * Current billing period that quotas count against, or null when the
 * subscription is not entitled (PENDING, EXPIRED, or past expiresAt).
 * Paid plans end at expiresAt; open-ended plans step monthly from startedAt.
 */
export function quotaPeriodForSubscription(
    subscription: PeriodSubscription,
    now = new Date(),
): QuotaPeriod | null {
    if (subscription.status !== "ACTIVE" && subscription.status !== "PAST_DUE") {
        return null
    }

    if (subscription.expiresAt) {
        if (subscription.expiresAt.getTime() <= now.getTime()) return null
        // An early renewal pushes expiresAt a month ahead; walk back to the period containing now.
        let periodEnd = subscription.expiresAt
        let periodStart = proPeriodStartBefore(periodEnd)
        while (
            periodStart.getTime() > now.getTime() &&
            periodStart.getTime() > subscription.startedAt.getTime()
        ) {
            periodEnd = periodStart
            periodStart = proPeriodStartBefore(periodEnd)
        }
        return {
            periodStart:
                periodStart.getTime() > subscription.startedAt.getTime()
                    ? periodStart
                    : subscription.startedAt,
            periodEnd,
        }
    }

    let periodStart = subscription.startedAt
    let periodEnd = proRenewsAt(periodStart)
    while (periodEnd.getTime() <= now.getTime()) {
        periodStart = periodEnd
        periodEnd = proRenewsAt(periodStart)
    }
    return { periodStart, periodEnd }
}

/** UTC `YYYY-MM` keys for every calendar month overlapping any interval, newest first. */
export function monthsOverlapping(intervals: { start: Date; end: Date }[]): string[] {
    const months = new Set<string>()
    for (const { start, end } of intervals) {
        if (end.getTime() <= start.getTime()) continue
        let year = start.getUTCFullYear()
        let month = start.getUTCMonth()
        while (Date.UTC(year, month, 1) < end.getTime()) {
            months.add(`${year}-${String(month + 1).padStart(2, "0")}`)
            month += 1
            if (month === 12) {
                month = 0
                year += 1
            }
        }
    }
    return [...months].sort().reverse()
}

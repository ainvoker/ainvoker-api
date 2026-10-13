import type { QuotaPeriod } from "../billing/period.js"
import { startOfAnalyticsRange, startOfNextUtcDay, startOfUtcDay } from "./aggregate.js"
import type { UsageRangeQuery } from "./schemas.js"

export type UsageWindow = {
    range: UsageRangeQuery["range"]
    /** Inclusive start instant. */
    start: Date
    /** Exclusive end; may be in the future for the current period or month. */
    end: Date
    /** Last instant with countable usage: min(now, end). Aggregations run through this UTC day. */
    asOf: Date
}

function parseUtcDate(value: string): Date {
    return new Date(`${value}T00:00:00.000Z`)
}

/** Translate a dashboard range query into concrete UTC bounds. */
export function resolveUsageWindow(
    query: UsageRangeQuery,
    currentPeriod: QuotaPeriod | null,
    now = new Date(),
): UsageWindow {
    const range = query.range === "billing_month" ? "current_period" : query.range
    let start: Date
    let end: Date

    if (range === "7d" || range === "30d") {
        start = startOfAnalyticsRange(range, now)
        end = startOfNextUtcDay(now)
    } else if (range === "calendar_month") {
        const [year, month] = query.month!.split("-").map(Number) as [number, number]
        start = new Date(Date.UTC(year, month - 1, 1))
        end = new Date(Date.UTC(year, month, 1))
    } else if (range === "custom") {
        start = parseUtcDate(query.from!)
        end = startOfNextUtcDay(parseUtcDate(query.to!))
    } else if (currentPeriod) {
        start = currentPeriod.periodStart
        end = currentPeriod.periodEnd
    } else {
        start = startOfUtcDay(now)
        end = startOfNextUtcDay(now)
    }

    const asOf = end.getTime() > now.getTime() ? now : new Date(end.getTime() - 1)
    return { range, start, end, asOf }
}

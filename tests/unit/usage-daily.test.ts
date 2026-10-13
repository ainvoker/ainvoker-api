import { describe, expect, it } from "vitest"
import {
    fillDailySeries,
    startOfAnalyticsRange,
    startOfNextUtcDay,
    startOfUtcMonth,
} from "../../src/modules/usage/aggregate.js"
import { resolveUsageWindow } from "../../src/modules/usage/window.js"

describe("resolveUsageWindow", () => {
    const now = new Date("2026-10-20T12:00:00.000Z")
    const currentPeriod = {
        periodStart: new Date("2026-10-15T09:30:00.000Z"),
        periodEnd: new Date("2026-11-15T09:30:00.000Z"),
    }

    it("uses the billing period for current_period and its billing_month alias", () => {
        for (const range of ["current_period", "billing_month"] as const) {
            const window = resolveUsageWindow({ range }, currentPeriod, now)
            expect(window).toEqual({
                range: "current_period",
                start: currentPeriod.periodStart,
                end: currentPeriod.periodEnd,
                asOf: now,
            })
        }
    })

    it("falls back to today when no period is entitled", () => {
        const window = resolveUsageWindow({ range: "current_period" }, null, now)
        expect(window.start.toISOString()).toBe("2026-10-20T00:00:00.000Z")
        expect(window.end.toISOString()).toBe("2026-10-21T00:00:00.000Z")
    })

    it("bounds a past calendar month and stops it at its last day", () => {
        const window = resolveUsageWindow({ range: "calendar_month", month: "2026-09" }, null, now)
        expect(window.start.toISOString()).toBe("2026-09-01T00:00:00.000Z")
        expect(window.end.toISOString()).toBe("2026-10-01T00:00:00.000Z")
        expect(window.asOf.toISOString()).toBe("2026-09-30T23:59:59.999Z")
        expect(fillDailySeries(window.start, new Map(), window.asOf)).toHaveLength(30)
    })

    it("has no elapsed days for a future month", () => {
        const window = resolveUsageWindow({ range: "calendar_month", month: "2026-11" }, null, now)
        expect(window.asOf).toEqual(now)
        expect(fillDailySeries(window.start, new Map(), window.asOf)).toHaveLength(0)
    })

    it("includes both endpoints of a custom range", () => {
        const window = resolveUsageWindow(
            { range: "custom", from: "2024-02-27", to: "2024-03-02" },
            null,
            now,
        )
        expect(window.start.toISOString()).toBe("2024-02-27T00:00:00.000Z")
        expect(window.end.toISOString()).toBe("2024-03-03T00:00:00.000Z")
        expect(fillDailySeries(window.start, new Map(), window.asOf)).toHaveLength(5)
    })
})

describe("startOfAnalyticsRange", () => {
    const now = new Date(Date.UTC(2026, 8, 3, 15, 30, 0)) // Sep 3

    it("counts today as the last day of rolling ranges, crossing months", () => {
        expect(startOfAnalyticsRange("7d", now).toISOString()).toBe("2026-08-28T00:00:00.000Z")
        expect(startOfAnalyticsRange("30d", now).toISOString()).toBe("2026-08-05T00:00:00.000Z")
        expect(fillDailySeries(startOfAnalyticsRange("7d", now), new Map(), now)).toHaveLength(7)
    })
})

describe("startOfNextUtcDay", () => {
    it("returns the exclusive upper bound after today UTC", () => {
        const now = new Date(Date.UTC(2026, 8, 17, 15, 30, 0))
        expect(startOfNextUtcDay(now).toISOString()).toBe(
            "2026-09-18T00:00:00.000Z",
        )
    })
})

describe("fillDailySeries", () => {
    it("fills every UTC day from period start through today with zeros", () => {
        const now = new Date(Date.UTC(2026, 8, 17, 15, 0, 0)) // Sep 17
        const periodStart = startOfUtcMonth(now)
        const points = fillDailySeries(periodStart, new Map(), now)

        expect(points).toHaveLength(17)
        expect(points[0]?.date).toBe("2026-09-01")
        expect(points[16]?.date).toBe("2026-09-17")
        expect(points.every((p) => p.requestsUsed === 0)).toBe(true)
    })

    it("merges sparse buckets into the filled series", () => {
        const now = new Date(Date.UTC(2026, 8, 3, 12, 0, 0))
        const periodStart = startOfUtcMonth(now)
        const buckets = new Map([
            [
                "2026-09-02",
                {
                    requestsUsed: 4,
                    tokensUsed: 10,
                    successfulRequests: 3,
                    failedRequests: 1,
                },
            ],
        ])
        const points = fillDailySeries(periodStart, buckets, now)

        expect(points).toHaveLength(3)
        expect(points[0]).toMatchObject({ date: "2026-09-01", requestsUsed: 0 })
        expect(points[1]).toMatchObject({
            date: "2026-09-02",
            requestsUsed: 4,
            tokensUsed: 10,
            successfulRequests: 3,
            failedRequests: 1,
        })
        expect(points[2]).toMatchObject({ date: "2026-09-03", requestsUsed: 0 })
    })
})

import { describe, expect, it } from "vitest"
import {
    fillDailySeries,
    startOfAnalyticsRange,
    startOfNextUtcDay,
    startOfUtcMonth,
} from "../../src/modules/usage/aggregate.js"

describe("startOfAnalyticsRange", () => {
    const now = new Date(Date.UTC(2026, 8, 3, 15, 30, 0)) // Sep 3

    it("uses the UTC month start for billing_month", () => {
        expect(startOfAnalyticsRange("billing_month", now).toISOString()).toBe(
            "2026-09-01T00:00:00.000Z",
        )
    })

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

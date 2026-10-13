import { describe, expect, it } from "vitest"
import {
    isEntitlementUnexpired,
    monthsOverlapping,
    proPeriodStartBefore,
    proRenewsAt,
    quotaPeriodForSubscription,
} from "../../src/modules/billing/period.js"

describe("proRenewsAt", () => {
    it("adds one calendar month", () => {
        const start = new Date("2026-01-15T12:00:00.000Z")
        const next = proRenewsAt(start)
        expect(next.toISOString()).toBe("2026-02-15T12:00:00.000Z")
    })

    it("caps day-of-month at 28", () => {
        const start = new Date("2026-01-31T12:00:00.000Z")
        const next = proRenewsAt(start)
        expect(next.getUTCDate()).toBe(28)
        expect(next.getUTCMonth()).toBe(1)
    })
})

describe("isEntitlementUnexpired", () => {
    it("treats null expiry as still entitled", () => {
        expect(isEntitlementUnexpired(null)).toBe(true)
    })

    it("returns false when expiry is in the past", () => {
        expect(isEntitlementUnexpired(new Date(Date.now() - 1000))).toBe(false)
    })
})

describe("proPeriodStartBefore", () => {
    it("inverts proRenewsAt", () => {
        const start = new Date("2026-10-15T09:30:00.000Z")
        expect(proPeriodStartBefore(proRenewsAt(start)).toISOString()).toBe(start.toISOString())
    })

    it("clamps to the previous month's last day", () => {
        expect(proPeriodStartBefore(new Date("2026-03-31T00:00:00.000Z")).toISOString()).toBe(
            "2026-02-28T00:00:00.000Z",
        )
    })
})

describe("quotaPeriodForSubscription", () => {
    const startedAt = new Date("2026-10-15T09:30:00.000Z")
    const expiresAt = proRenewsAt(startedAt)

    it("starts a paid period on the payment date, not the 1st of the month", () => {
        const period = quotaPeriodForSubscription(
            { status: "ACTIVE", startedAt, expiresAt },
            new Date("2026-10-20T00:00:00.000Z"),
        )
        expect(period).toEqual({ periodStart: startedAt, periodEnd: expiresAt })
    })

    it("advances to the renewed period once the old one ends", () => {
        const renewedExpiry = proRenewsAt(expiresAt)
        const period = quotaPeriodForSubscription(
            { status: "ACTIVE", startedAt, expiresAt: renewedExpiry },
            new Date("2026-11-20T00:00:00.000Z"),
        )
        expect(period).toEqual({ periodStart: expiresAt, periodEnd: renewedExpiry })
    })

    it("keeps the current period when a renewal lands early", () => {
        const period = quotaPeriodForSubscription(
            { status: "ACTIVE", startedAt, expiresAt: proRenewsAt(expiresAt) },
            new Date("2026-11-10T00:00:00.000Z"),
        )
        expect(period).toEqual({ periodStart: startedAt, periodEnd: expiresAt })
    })

    it("steps open-ended plans monthly from startedAt", () => {
        const period = quotaPeriodForSubscription(
            { status: "ACTIVE", startedAt, expiresAt: null },
            new Date("2027-01-20T00:00:00.000Z"),
        )
        expect(period?.periodStart.toISOString()).toBe("2027-01-15T09:30:00.000Z")
        expect(period?.periodEnd.toISOString()).toBe("2027-02-15T09:30:00.000Z")
    })

    it("has no period for pending or lapsed plans", () => {
        const now = new Date("2026-10-20T00:00:00.000Z")
        expect(quotaPeriodForSubscription({ status: "PENDING", startedAt, expiresAt: null }, now)).toBeNull()
        expect(quotaPeriodForSubscription({ status: "EXPIRED", startedAt, expiresAt }, now)).toBeNull()
        expect(
            quotaPeriodForSubscription(
                { status: "ACTIVE", startedAt, expiresAt },
                new Date("2026-12-01T00:00:00.000Z"),
            ),
        ).toBeNull()
    })
})

describe("monthsOverlapping", () => {
    it("lists every calendar month a mid-month plan touches, newest first", () => {
        const start = new Date("2026-10-15T09:30:00.000Z")
        expect(monthsOverlapping([{ start, end: proRenewsAt(start) }])).toEqual([
            "2026-11",
            "2026-10",
        ])
    })

    it("merges intervals across years without duplicates", () => {
        expect(
            monthsOverlapping([
                {
                    start: new Date("2026-12-20T00:00:00.000Z"),
                    end: new Date("2027-01-20T00:00:00.000Z"),
                },
                {
                    start: new Date("2027-01-20T00:00:00.000Z"),
                    end: new Date("2027-02-01T00:00:00.000Z"),
                },
            ]),
        ).toEqual(["2027-01", "2026-12"])
    })
})

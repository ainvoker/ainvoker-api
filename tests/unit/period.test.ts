import { describe, expect, it } from "vitest"
import { isEntitlementUnexpired, proRenewsAt } from "../../src/modules/billing/period.js"

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

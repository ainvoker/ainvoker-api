import { describe, expect, it } from "vitest"
import {
    PRO_PREPAID_DAYS,
    isEntitlementUnexpired,
    proPrepaidExpiresAt,
} from "../../src/modules/billing/period.js"

describe("proPrepaidExpiresAt", () => {
    it("is 30 days after the start", () => {
        const started = new Date("2026-08-12T00:00:00.000Z")
        const expires = proPrepaidExpiresAt(started)
        const days = (expires.getTime() - started.getTime()) / 86_400_000
        expect(days).toBe(PRO_PREPAID_DAYS)
    })
})

describe("isEntitlementUnexpired", () => {
    const now = new Date("2026-08-12T12:00:00.000Z")

    it("grandfathers null expiry", () => {
        expect(isEntitlementUnexpired(null, now)).toBe(true)
    })

    it("is entitled before expiry", () => {
        expect(isEntitlementUnexpired(new Date("2026-08-13T00:00:00.000Z"), now)).toBe(true)
    })

    it("is lapsed at or after expiry", () => {
        expect(isEntitlementUnexpired(new Date("2026-08-12T12:00:00.000Z"), now)).toBe(false)
        expect(isEntitlementUnexpired(new Date("2026-08-11T00:00:00.000Z"), now)).toBe(false)
    })
})

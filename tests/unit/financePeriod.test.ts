import { describe, expect, it } from "vitest"
import { currentFinancePeriod, parseFinancePeriod } from "../../src/modules/finance/period.js"

describe("parseFinancePeriod", () => {
    it("returns UTC half-open bounds for a calendar month", () => {
        const { start, end, period } = parseFinancePeriod("2026-10")
        expect(period).toBe("2026-10")
        expect(start.toISOString()).toBe("2026-10-01T00:00:00.000Z")
        expect(end.toISOString()).toBe("2026-11-01T00:00:00.000Z")
    })

    it("handles December rollover", () => {
        const { start, end } = parseFinancePeriod("2025-12")
        expect(start.toISOString()).toBe("2025-12-01T00:00:00.000Z")
        expect(end.toISOString()).toBe("2026-01-01T00:00:00.000Z")
    })

    it("rejects invalid formats", () => {
        expect(() => parseFinancePeriod("2026-13")).toThrow(/month/)
        expect(() => parseFinancePeriod("26-10")).toThrow(/YYYY-MM/)
        expect(() => parseFinancePeriod("october")).toThrow(/YYYY-MM/)
    })
})

describe("currentFinancePeriod", () => {
    it("formats the UTC month", () => {
        expect(currentFinancePeriod(new Date("2026-03-15T12:00:00.000Z"))).toBe("2026-03")
    })
})

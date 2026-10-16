import { describe, expect, it } from "vitest"
import {
    isOpenAiCostCsv,
    matchProviderRows,
    matchXenditRows,
    parseOpenAiCostCsv,
    parseProviderCsv,
    parseXenditCsv,
} from "../../src/modules/finance/csv.js"
import { parseFinancePeriod } from "../../src/modules/finance/period.js"

const OPENAI_COST_HEADER =
    "start_time,end_time,start_time_iso,end_time_iso,amount_value,amount_currency,quantity,quantity_unit,line_item,user_id,api_key_id,project_id,organization_id,project_name,organization_name,user_email,api_source"

/** Mirrors a Usage Dashboard cost export: empty days + Oct spend. */
const OPENAI_COST_FIXTURE = [
    OPENAI_COST_HEADER,
    "1789516800,1789603200,2026-09-16T00:00:00+00:00,2026-09-17T00:00:00+00:00,,,,,,,,,,,,,",
    "1791590400,1791676800,2026-10-10T00:00:00,2026-10-11T00:00:00,0.02281320000000000000000000000,usd,,,,,,,org-test,,OishiPalomares,,",
    "1791936000,1792022400,2026-10-14T00:00:00,2026-10-15T00:00:00,0.01411445000000000000000000000,usd,,,,,,,org-test,,OishiPalomares,,",
    "1792022400,1792108800,2026-10-15T00:00:00,2026-10-16T00:00:00,0.0001041000000000000000000000000,usd,,,,,,,org-test,,OishiPalomares,,",
].join("\n")

describe("parseXenditCsv", () => {
    it("maps flexible headers and peso amounts", () => {
        const rows = parseXenditCsv(
            ["external_id,settled_amount", "ref-1,499.00", "ref-2,100.50"].join("\n"),
        )
        expect(rows).toEqual([
            { reference: "ref-1", amountPhp: 499, line: 2 },
            { reference: "ref-2", amountPhp: 100.5, line: 3 },
        ])
    })

    it("converts amount_centavos headers to pesos", () => {
        const rows = parseXenditCsv("reference,amount_centavos\nref-c,49900")
        expect(rows[0].amountPhp).toBe(499)
    })

    it("requires reference and amount columns", () => {
        expect(() => parseXenditCsv("foo,bar\n1,2")).toThrow(/reference/)
    })
})

describe("parseProviderCsv", () => {
    it("parses provider + amount_usd", () => {
        const rows = parseProviderCsv("provider,amount_usd\nOpenAI,12.50\nGemini,3")
        expect(rows).toEqual([
            { provider: "OpenAI", amount: 12.5, currency: "usd", line: 2 },
            { provider: "Gemini", amount: 3, currency: "usd", line: 3 },
        ])
    })

    it("flags PHP amount columns", () => {
        const rows = parseProviderCsv("vendor,amount_php\nOpenAI,580")
        expect(rows[0]).toMatchObject({ currency: "php", amount: 580 })
    })

    it("auto-detects OpenAI cost exports when bounds are provided", () => {
        const { start, end } = parseFinancePeriod("2026-10")
        const rows = parseProviderCsv(OPENAI_COST_FIXTURE, { start, end })
        expect(rows).toHaveLength(1)
        expect(rows[0].provider).toBe("openai")
        expect(rows[0].amount).toBeCloseTo(0.03703175, 8)
    })

    it("requires bounds for OpenAI cost exports", () => {
        expect(() => parseProviderCsv(OPENAI_COST_FIXTURE)).toThrow(/period/)
    })
})

describe("isOpenAiCostCsv / parseOpenAiCostCsv", () => {
    it("detects OpenAI cost headers", () => {
        expect(
            isOpenAiCostCsv([
                "start_time",
                "end_time",
                "start_time_iso",
                "amount_value",
                "amount_currency",
            ]),
        ).toBe(true)
        expect(isOpenAiCostCsv(["provider", "amount_usd"])).toBe(false)
    })

    it("sums USD rows overlapping October only", () => {
        const { start, end } = parseFinancePeriod("2026-10")
        const rows = parseOpenAiCostCsv(OPENAI_COST_FIXTURE, { start, end })
        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({ provider: "openai", currency: "usd", line: 0 })
        expect(rows[0].amount).toBeCloseTo(0.0228132 + 0.01411445 + 0.0001041, 8)
    })

    it("returns zero when the period has no overlapping spend", () => {
        const { start, end } = parseFinancePeriod("2026-08")
        const rows = parseOpenAiCostCsv(OPENAI_COST_FIXTURE, { start, end })
        expect(rows).toEqual([{ provider: "openai", amount: 0, currency: "usd", line: 0 }])
    })
})

describe("matchXenditRows", () => {
    it("flags amount mismatch, csv-only, and db-only", () => {
        const result = matchXenditRows(
            [
                { reference: "a", amountPhp: 100, line: 2 },
                { reference: "b", amountPhp: 50, line: 3 },
                { reference: "c", amountPhp: 10, line: 4 },
            ],
            [
                { referenceNumber: "a", amountPhp: 100 },
                { referenceNumber: "b", amountPhp: 55 },
                { referenceNumber: "d", amountPhp: 1 },
            ],
        )
        expect(result.matchedCount).toBe(1)
        expect(result.driftCount).toBe(3)
        expect(result.items.find((i) => i.reference === "a")?.status).toBe("matched")
        expect(result.items.find((i) => i.reference === "b")?.status).toBe("amount_mismatch")
        expect(result.items.find((i) => i.reference === "c")?.status).toBe("csv_only")
        expect(result.items.find((i) => i.reference === "d")?.status).toBe("db_only")
    })
})

describe("matchProviderRows", () => {
    it("matches case-insensitively within USD tolerance", () => {
        const result = matchProviderRows(
            [{ provider: "OpenAI", amountUsd: 10 }],
            [{ provider: "openai", amountUsd: 10.2 }],
        )
        expect(result.matchedCount).toBe(1)
        expect(result.driftCount).toBe(0)
    })

    it("flags drift beyond tolerance", () => {
        const result = matchProviderRows(
            [{ provider: "OpenAI", amountUsd: 10 }],
            [{ provider: "OpenAI", amountUsd: 12 }],
        )
        expect(result.items[0].status).toBe("amount_mismatch")
    })
})

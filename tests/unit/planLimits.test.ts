import { describe, expect, it } from "vitest"
import { AppError } from "../../src/platform/errors.js"
import { assertModelAllowedForPlan } from "../../src/modules/billing/limits.js"

const freeEconomy = { name: "gpt-4o-mini", planTier: "ECONOMY", freeEligible: true } as const
const proEconomy = { name: "gpt-6-luna", planTier: "ECONOMY", freeEligible: false } as const
const premium = { name: "gpt-6-astra", planTier: "PREMIUM", freeEligible: false } as const

function expectNotAllowed(fn: () => void) {
    try {
        fn()
        expect.unreachable()
    } catch (err) {
        expect(err).toBeInstanceOf(AppError)
        expect((err as AppError).status).toBe(403)
        expect((err as AppError).code).toBe("MODEL_NOT_ALLOWED_ON_PLAN")
    }
}

describe("assertModelAllowedForPlan", () => {
    it("allows only freeEligible economy models on Free", () => {
        expect(() => assertModelAllowedForPlan({ name: "free" }, freeEconomy)).not.toThrow()
        expectNotAllowed(() => assertModelAllowedForPlan({ name: "free" }, proEconomy))
        expectNotAllowed(() => assertModelAllowedForPlan({ name: "free" }, premium))
    })

    it("allows any model on Pro, including premium", () => {
        expect(() => assertModelAllowedForPlan({ name: "pro" }, freeEconomy)).not.toThrow()
        expect(() => assertModelAllowedForPlan({ name: "pro" }, proEconomy)).not.toThrow()
        expect(() => assertModelAllowedForPlan({ name: "pro" }, premium)).not.toThrow()
    })

    it("allows any model on Scale", () => {
        expect(() => assertModelAllowedForPlan({ name: "scale" }, freeEconomy)).not.toThrow()
        expect(() => assertModelAllowedForPlan({ name: "scale" }, proEconomy)).not.toThrow()
        expect(() => assertModelAllowedForPlan({ name: "scale" }, premium)).not.toThrow()
    })
})

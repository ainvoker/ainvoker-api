import { describe, expect, it } from "vitest"
import { AppError } from "../../src/platform/errors.js"
import { assertModelAllowedForPlan } from "../../src/modules/billing/limits.js"

describe("assertModelAllowedForPlan", () => {
    it("allows any model on Pro", () => {
        expect(() =>
            assertModelAllowedForPlan(
                { name: "pro" },
                { name: "gpt-4o", freeEligible: false },
            ),
        ).not.toThrow()
    })

    it("allows freeEligible models on Free", () => {
        expect(() =>
            assertModelAllowedForPlan(
                { name: "free" },
                { name: "gpt-4o-mini", freeEligible: true },
            ),
        ).not.toThrow()
    })

    it("rejects non-eligible models on Free", () => {
        try {
            assertModelAllowedForPlan(
                { name: "free" },
                { name: "gpt-4o", freeEligible: false },
            )
            expect.unreachable()
        } catch (err) {
            expect(err).toBeInstanceOf(AppError)
            expect((err as AppError).status).toBe(403)
            expect((err as AppError).code).toBe("MODEL_NOT_ALLOWED_ON_PLAN")
        }
    })
})

import { describe, expect, it } from "vitest"
import {
    estimateProviderCogsUsd,
    moneyString,
    roundMoney,
    usdToPhp,
} from "../../src/modules/finance/cogs.js"

describe("estimateProviderCogsUsd", () => {
    it("computes tokens × provider $/1M", () => {
        // 1M input @ $1 + 500k output @ $2 = $1 + $1 = $2
        const usd = estimateProviderCogsUsd({
            inputTokens: 1_000_000,
            outputTokens: 500_000,
            providerInputPrice: 1,
            providerOutputPrice: 2,
        })
        expect(usd).toBe(2)
    })

    it("treats null tokens as zero", () => {
        expect(
            estimateProviderCogsUsd({
                inputTokens: null,
                outputTokens: null,
                providerInputPrice: "3",
                providerOutputPrice: "4",
            }),
        ).toBe(0)
    })
})

describe("usdToPhp / money helpers", () => {
    it("converts with FX", () => {
        expect(usdToPhp(10, 58)).toBe(580)
    })

    it("rounds and stringifies money", () => {
        expect(roundMoney(1.005)).toBe(1.01)
        expect(moneyString(12.3)).toBe("12.30")
    })
})

/** Provider list cost in USD for one request (tokens × provider $/1M). */
export function estimateProviderCogsUsd(input: {
    inputTokens: number | null | undefined
    outputTokens: number | null | undefined
    providerInputPrice: number | string
    providerOutputPrice: number | string
}): number {
    const inputTokens = input.inputTokens ?? 0
    const outputTokens = input.outputTokens ?? 0
    const inPrice = Number(input.providerInputPrice)
    const outPrice = Number(input.providerOutputPrice)
    if (!Number.isFinite(inPrice) || !Number.isFinite(outPrice)) return 0
    return (inPrice * inputTokens + outPrice * outputTokens) / 1_000_000
}

export function usdToPhp(usd: number, rate: number): number {
    if (!Number.isFinite(usd) || !Number.isFinite(rate)) return 0
    return usd * rate
}

export function roundMoney(n: number, digits = 2): number {
    const f = 10 ** digits
    return Math.round((n + Number.EPSILON) * f) / f
}

export function moneyString(n: number, digits = 2): string {
    return roundMoney(n, digits).toFixed(digits)
}

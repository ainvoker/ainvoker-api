import type { Response } from "express"
import type { QuotaSnapshot } from "./limits.js"

export function setRateLimitHeaders(res: Response, quota: QuotaSnapshot) {
    if (quota.requestLimit > 0) {
        res.setHeader("X-RateLimit-Limit-Requests", String(quota.requestLimit))
        res.setHeader(
            "X-RateLimit-Remaining-Requests",
            String(Math.max(0, quota.requestLimit - quota.requestsUsed - 1)),
        )
    }
    if (quota.tokenLimit > 0) {
        res.setHeader("X-RateLimit-Limit-Tokens", String(quota.tokenLimit))
        res.setHeader(
            "X-RateLimit-Remaining-Tokens",
            String(Math.max(0, quota.tokenLimit - quota.tokensUsed)),
        )
    }
}

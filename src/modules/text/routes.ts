import { Router } from "express"
import type { Request, Response } from "express"
import requireApiKey from "../../middleware/requireApiKey.js"
import { BaseRoutes } from "../../platform/BaseRoutes.js"
import { AppError } from "../../platform/errors.js"
import http from "../../platform/http.js"
import type { QuotaSnapshot } from "../billing/limits.js"
import { textChatSchema } from "./schemas.js"
import textService from "./service.js"

function setRateLimitHeaders(res: Response, quota: QuotaSnapshot) {
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

function writeSseEvent(res: Response, event: string, data: unknown) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

class TextRoutes extends BaseRoutes {
    readonly router = Router()

    constructor() {
        super()
        this.router.post("/chat", requireApiKey, this.bind(this.chat))
        this.router.post("/stream", requireApiKey, this.bind(this.stream))
    }

    private requireApiKeyContext(req: Request) {
        if (!req.apiKeyContext) {
            throw new AppError(401, "UNAUTHORIZED", "API key required")
        }
        return req.apiKeyContext
    }

    private async chat(req: Request, res: Response) {
        const apiKeyContext = this.requireApiKeyContext(req)
        const body = textChatSchema.parse(req.body)
        const { quota, ...data } = await textService.chat(apiKeyContext, body)
        setRateLimitHeaders(res, quota)
        http.ok(res, data)
    }

    private async stream(req: Request, res: Response) {
        const apiKeyContext = this.requireApiKeyContext(req)
        const body = textChatSchema.parse(req.body)

        // openStream must succeed before any SSE headers so pre-stream errors stay JSON.
        const session = await textService.stream(apiKeyContext, body)

        setRateLimitHeaders(res, session.quota)
        res.status(200)
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8")
        res.setHeader("Cache-Control", "no-cache, no-transform")
        res.setHeader("Connection", "keep-alive")
        res.flushHeaders?.()

        let clientClosed = false
        const onClose = () => {
            if (clientClosed) {
                return
            }
            clientClosed = true
            // After a normal res.end(), close also fires — only abort mid-stream.
            if (!res.writableEnded) {
                session.abort()
            }
        }
        // Client abort is reported on the response socket more reliably than req alone.
        res.on("close", onClose)
        req.on("aborted", onClose)

        try {
            writeSseEvent(res, "meta", { id: session.id, model: session.model })

            for await (const event of session.events()) {
                // Drain the generator after disconnect so it can mark FAILED.
                if (clientClosed || res.writableEnded) {
                    continue
                }
                if (event.type === "delta") {
                    writeSseEvent(res, "delta", { content: event.content })
                } else if (event.type === "tool_call") {
                    writeSseEvent(res, "tool_call", {
                        id: event.id,
                        name: event.name,
                        arguments: event.arguments,
                        ...(event.providerMetadata ? { providerMetadata: event.providerMetadata } : {}),
                    })
                } else if (event.type === "done") {
                    writeSseEvent(res, "done", {
                        message: event.message,
                        usage: event.usage,
                    })
                } else if (event.type === "error") {
                    writeSseEvent(res, "error", {
                        code: event.code,
                        message: event.message,
                    })
                }
            }
        } catch (err) {
            if (!clientClosed && !res.writableEnded) {
                const code = err instanceof AppError ? err.code : "INTERNAL_ERROR"
                const message = err instanceof Error ? err.message : "Stream failed"
                writeSseEvent(res, "error", { code, message })
            }
        } finally {
            res.off("close", onClose)
            req.off("aborted", onClose)
            if (!res.writableEnded) {
                res.write("\n")
                res.end()
            }
        }
    }
}

export default new TextRoutes()

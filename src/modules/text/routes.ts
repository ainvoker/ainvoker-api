import { Router } from "express"
import type { Request, Response } from "express"
import requireApiKey from "../../middleware/requireApiKey.js"
import { BaseRoutes } from "../../platform/BaseRoutes.js"
import { AppError } from "../../platform/errors.js"
import http from "../../platform/http.js"
import { textChatSchema } from "./schemas.js"
import textService from "./service.js"

class TextRoutes extends BaseRoutes {
    readonly router = Router()

    constructor() {
        super()
        this.router.post("/chat", requireApiKey, this.bind(this.chat))
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
        const data = await textService.chat(apiKeyContext, body)
        http.ok(res, data)
    }
}

export default new TextRoutes()

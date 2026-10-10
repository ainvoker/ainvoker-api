import { Router } from "express"
import type { Request, Response } from "express"
import requireApiKey from "../../middleware/requireApiKey.js"
import { BaseRoutes } from "../../platform/BaseRoutes.js"
import { AppError } from "../../platform/errors.js"
import http from "../../platform/http.js"
import { setRateLimitHeaders } from "../billing/headers.js"
import { imageGenerateSchema } from "./schemas.js"
import imageService from "./service.js"

class ImageRoutes extends BaseRoutes {
    readonly router = Router()

    constructor() {
        super()
        this.router.post("/generate", requireApiKey, this.bind(this.generate))
    }

    private async generate(req: Request, res: Response) {
        if (!req.apiKeyContext) {
            throw new AppError(401, "UNAUTHORIZED", "API key required")
        }
        const body = imageGenerateSchema.parse(req.body)
        const { quota, ...data } = await imageService.generate(req.apiKeyContext, body)
        setRateLimitHeaders(res, quota)
        http.ok(res, data)
    }
}

export default new ImageRoutes()

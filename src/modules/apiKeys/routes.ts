import { Router } from "express"
import type { Request, Response } from "express"
import requireSession from "../../middleware/requireSession.js"
import { BaseRoutes } from "../../platform/BaseRoutes.js"
import http from "../../platform/http.js"
import { apiKeyParamsSchema, createApiKeySchema, projectIdParamsSchema } from "./schemas.js"
import ApiKeysService from "./service.js"

class ApiKeysRoutes extends BaseRoutes {
    readonly router = Router()

    constructor() {
        super()

        this.router.get("/projects/:projectId/api-keys", requireSession, this.bind(this.list))
        this.router.post("/projects/:projectId/api-keys", requireSession, this.bind(this.create))
        this.router.post("/projects/:projectId/api-keys/:keyId/revoke", requireSession, this.bind(this.revoke))
        this.router.delete("/projects/:projectId/api-keys/:keyId", requireSession, this.bind(this.remove))
    }

    private async list(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const { projectId } = projectIdParamsSchema.parse(req.params)
        const data = await ApiKeysService.listApiKeys(projectId, auth.userId)

        http.ok(res, data)
    }

    private async create(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const { projectId } = projectIdParamsSchema.parse(req.params)
        const body = createApiKeySchema.parse(req.body)
        const data = await ApiKeysService.createApiKey(projectId, auth.userId, body)

        http.ok(res, data, 201)
    }

    private async revoke(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const { projectId, keyId } = apiKeyParamsSchema.parse(req.params)
        const data = await ApiKeysService.revokeApiKey(projectId, keyId, auth.userId)

        http.ok(res, data)
    }

    private async remove(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const { projectId, keyId } = apiKeyParamsSchema.parse(req.params)
        await ApiKeysService.deleteApiKey(projectId, keyId, auth.userId)

        http.ok(res, { deleted: true })
    }
}

export default new ApiKeysRoutes()

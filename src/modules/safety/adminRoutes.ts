import { Router } from "express"
import type { Request, Response } from "express"
import requirePlatformAdmin from "../../middleware/requirePlatformAdmin.js"
import requireSession from "../../middleware/requireSession.js"
import { BaseRoutes } from "../../platform/BaseRoutes.js"
import http from "../../platform/http.js"
import adminSafetyService from "./adminService.js"
import {
    adminApiKeyParamsSchema,
    adminProjectParamsSchema,
    listAdminApiKeysQuerySchema,
    listAdminProjectsQuerySchema,
    updateAdminProjectSchema,
} from "./adminSchemas.js"

class AdminSafetyRoutes extends BaseRoutes {
    readonly router = Router()

    constructor() {
        super()

        this.router.use(requireSession, requirePlatformAdmin)
        this.router.get("/api-keys", this.bind(this.listApiKeys))
        this.router.post("/api-keys/:keyId/revoke", this.bind(this.revokeApiKey))
        this.router.get("/projects", this.bind(this.listProjects))
        this.router.patch("/projects/:projectId", this.bind(this.updateProject))
    }

    private async listApiKeys(req: Request, res: Response) {
        const query = listAdminApiKeysQuerySchema.parse(req.query)
        const data = await adminSafetyService.listApiKeys(query)
        http.ok(res, data)
    }

    private async revokeApiKey(req: Request, res: Response) {
        const { keyId } = adminApiKeyParamsSchema.parse(req.params)
        const auth = this.requireAuth(req)
        const data = await adminSafetyService.revokeApiKey(keyId, auth.userId)
        http.ok(res, data)
    }

    private async listProjects(req: Request, res: Response) {
        const query = listAdminProjectsQuerySchema.parse(req.query)
        const data = await adminSafetyService.listProjects(query)
        http.ok(res, data)
    }

    private async updateProject(req: Request, res: Response) {
        const { projectId } = adminProjectParamsSchema.parse(req.params)
        const body = updateAdminProjectSchema.parse(req.body)
        const auth = this.requireAuth(req)
        const data = await adminSafetyService.updateProject(projectId, body, auth.userId)
        http.ok(res, data)
    }
}

export default new AdminSafetyRoutes()

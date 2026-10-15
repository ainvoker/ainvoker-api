import { Router } from "express"
import type { Request, Response } from "express"
import requirePlatformAdmin from "../../middleware/requirePlatformAdmin.js"
import requireSession from "../../middleware/requireSession.js"
import { BaseRoutes } from "../../platform/BaseRoutes.js"
import http from "../../platform/http.js"
import adminModelsService from "./adminModelsService.js"
import {
    adminModelParamsSchema,
    listAdminModelsQuerySchema,
    updateAdminModelSchema,
} from "./schemas.js"

class AdminCatalogRoutes extends BaseRoutes {
    readonly router = Router()

    constructor() {
        super()

        this.router.use(requireSession, requirePlatformAdmin)
        this.router.get("/providers", this.bind(this.listProviders))
        this.router.get("/models", this.bind(this.listModels))
        this.router.get("/models/:modelId", this.bind(this.getModel))
        this.router.patch("/models/:modelId", this.bind(this.updateModel))
    }

    private async listProviders(_req: Request, res: Response) {
        const data = await adminModelsService.listProviders()
        http.ok(res, data)
    }

    private async listModels(req: Request, res: Response) {
        const query = listAdminModelsQuerySchema.parse(req.query)
        const data = await adminModelsService.listModels(query)
        http.ok(res, data)
    }

    private async getModel(req: Request, res: Response) {
        const { modelId } = adminModelParamsSchema.parse(req.params)
        const data = await adminModelsService.getModel(modelId)
        http.ok(res, data)
    }

    private async updateModel(req: Request, res: Response) {
        const { modelId } = adminModelParamsSchema.parse(req.params)
        const body = updateAdminModelSchema.parse(req.body)
        const data = await adminModelsService.updateModel(modelId, body)
        http.ok(res, data)
    }
}

export default new AdminCatalogRoutes()

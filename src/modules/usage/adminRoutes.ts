import { Router } from "express"
import type { Request, Response } from "express"
import requirePlatformAdmin from "../../middleware/requirePlatformAdmin.js"
import requireSession from "../../middleware/requireSession.js"
import { BaseRoutes } from "../../platform/BaseRoutes.js"
import http from "../../platform/http.js"
import adminUsageService from "./adminService.js"
import {
    adminAiRequestParamsSchema,
    adminUsagePeriodQuerySchema,
    listAdminAiRequestsQuerySchema,
} from "./adminSchemas.js"

class AdminUsageRoutes extends BaseRoutes {
    readonly router = Router()

    constructor() {
        super()

        this.router.use(requireSession, requirePlatformAdmin)
        this.router.get("/usage", this.bind(this.getUsage))
        this.router.get("/ai-requests", this.bind(this.listAiRequests))
        this.router.get("/ai-requests/:requestId", this.bind(this.getAiRequest))
    }

    private async getUsage(req: Request, res: Response) {
        const query = adminUsagePeriodQuerySchema.parse(req.query)
        const data = await adminUsageService.getPlatformUsage(query)
        http.ok(res, data)
    }

    private async listAiRequests(req: Request, res: Response) {
        const query = listAdminAiRequestsQuerySchema.parse(req.query)
        const data = await adminUsageService.listAiRequests(query)
        http.ok(res, data)
    }

    private async getAiRequest(req: Request, res: Response) {
        const { requestId } = adminAiRequestParamsSchema.parse(req.params)
        const data = await adminUsageService.getAiRequest(requestId)
        http.ok(res, data)
    }
}

export default new AdminUsageRoutes()

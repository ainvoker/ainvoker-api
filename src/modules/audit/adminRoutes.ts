import { Router } from "express"
import type { Request, Response } from "express"
import requirePlatformAdmin from "../../middleware/requirePlatformAdmin.js"
import requireSession from "../../middleware/requireSession.js"
import { BaseRoutes } from "../../platform/BaseRoutes.js"
import http from "../../platform/http.js"
import adminAuditService from "./adminService.js"
import { listAdminAuditEventsQuerySchema } from "./adminSchemas.js"

class AdminAuditRoutes extends BaseRoutes {
    readonly router = Router()

    constructor() {
        super()

        this.router.use(requireSession, requirePlatformAdmin)
        this.router.get("/audit-events", this.bind(this.listEvents))
    }

    private async listEvents(req: Request, res: Response) {
        const query = listAdminAuditEventsQuerySchema.parse(req.query)
        const data = await adminAuditService.listEvents(query)
        http.ok(res, data)
    }
}

export default new AdminAuditRoutes()

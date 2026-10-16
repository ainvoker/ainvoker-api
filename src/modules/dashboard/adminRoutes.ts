import { Router } from "express"
import type { Request, Response } from "express"
import requirePlatformAdmin from "../../middleware/requirePlatformAdmin.js"
import requireSession from "../../middleware/requireSession.js"
import { BaseRoutes } from "../../platform/BaseRoutes.js"
import http from "../../platform/http.js"
import adminDashboardService from "./adminService.js"
import { adminDashboardQuerySchema } from "./adminSchemas.js"

class AdminDashboardRoutes extends BaseRoutes {
    readonly router = Router()

    constructor() {
        super()

        this.router.use(requireSession, requirePlatformAdmin)
        this.router.get("/dashboard", this.bind(this.getDashboard))
    }

    private async getDashboard(req: Request, res: Response) {
        const query = adminDashboardQuerySchema.parse(req.query)
        const data = await adminDashboardService.getDashboard(query)
        http.ok(res, data)
    }
}

export default new AdminDashboardRoutes()

import { Router } from "express"
import type { Request, Response } from "express"
import requireOrgMember from "../../middleware/requireOrgMember.js"
import requireSession from "../../middleware/requireSession.js"
import { BaseRoutes } from "../../platform/BaseRoutes.js"
import http from "../../platform/http.js"
import { orgIdParamsSchema } from "../organizations/schemas.js"
import { projectIdParamsSchema } from "../projects/schemas.js"
import { projectAnalyticsQuerySchema } from "./schemas.js"
import usageService from "./service.js"

class UsageRoutes extends BaseRoutes {
    readonly router = Router()

    constructor() {
        super()

        this.router.get(
            "/organizations/:orgId/usage",
            requireSession,
            requireOrgMember,
            this.bind(this.orgUsage),
        )
        this.router.get(
            "/projects/:projectId/usage",
            requireSession,
            this.bind(this.projectUsage),
        )
        this.router.get(
            "/projects/:projectId/analytics",
            requireSession,
            this.bind(this.projectAnalytics),
        )
    }

    private async orgUsage(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const { orgId } = orgIdParamsSchema.parse(req.params)
        const data = await usageService.getOrganizationUsage(orgId, auth.userId)
        http.ok(res, data)
    }

    private async projectUsage(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const { projectId } = projectIdParamsSchema.parse(req.params)
        const data = await usageService.getProjectUsage(projectId, auth.userId)
        http.ok(res, data)
    }

    private async projectAnalytics(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const { projectId } = projectIdParamsSchema.parse(req.params)
        const { range } = projectAnalyticsQuerySchema.parse(req.query)
        const data = await usageService.getProjectAnalytics(projectId, auth.userId, range)
        http.ok(res, data)
    }
}

export default new UsageRoutes()

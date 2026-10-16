import { Router } from "express"
import type { Request, Response } from "express"
import requirePlatformAdmin from "../../middleware/requirePlatformAdmin.js"
import requireSession from "../../middleware/requireSession.js"
import { BaseRoutes } from "../../platform/BaseRoutes.js"
import http from "../../platform/http.js"
import adminCustomersService from "./service.js"
import {
    adminOrganizationParamsSchema,
    adminUserParamsSchema,
    listAdminOrganizationsQuerySchema,
    listAdminUsersQuerySchema,
    updateAdminOrganizationSchema,
} from "./schemas.js"

class AdminCustomersRoutes extends BaseRoutes {
    readonly router = Router()

    constructor() {
        super()

        this.router.use(requireSession, requirePlatformAdmin)
        this.router.get("/organizations", this.bind(this.listOrganizations))
        this.router.get("/organizations/:orgId", this.bind(this.getOrganization))
        this.router.patch("/organizations/:orgId", this.bind(this.updateOrganization))
        this.router.get("/users", this.bind(this.listUsers))
        this.router.get("/users/:userId", this.bind(this.getUser))
    }

    private async listOrganizations(req: Request, res: Response) {
        const query = listAdminOrganizationsQuerySchema.parse(req.query)
        const data = await adminCustomersService.listOrganizations(query)
        http.ok(res, data)
    }

    private async getOrganization(req: Request, res: Response) {
        const { orgId } = adminOrganizationParamsSchema.parse(req.params)
        const data = await adminCustomersService.getOrganization(orgId)
        http.ok(res, data)
    }

    private async updateOrganization(req: Request, res: Response) {
        const { orgId } = adminOrganizationParamsSchema.parse(req.params)
        const body = updateAdminOrganizationSchema.parse(req.body)
        const auth = this.requireAuth(req)
        const data = await adminCustomersService.updateOrganization(orgId, body, auth.userId)
        http.ok(res, data)
    }

    private async listUsers(req: Request, res: Response) {
        const query = listAdminUsersQuerySchema.parse(req.query)
        const data = await adminCustomersService.listUsers(query)
        http.ok(res, data)
    }

    private async getUser(req: Request, res: Response) {
        const { userId } = adminUserParamsSchema.parse(req.params)
        const data = await adminCustomersService.getUser(userId)
        http.ok(res, data)
    }
}

export default new AdminCustomersRoutes()

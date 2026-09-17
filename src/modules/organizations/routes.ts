import { Router } from "express"
import type { Request, Response } from "express"
import requireSession from "../../middleware/requireSession.js"
import { BaseRoutes } from "../../platform/BaseRoutes.js"
import http from "../../platform/http.js"
import {
    createOrganizationSchema,
    orgIdParamsSchema,
    updateOrganizationSchema,
} from "./schemas.js"
import OrganizationsService from "./service.js"

class OrganizationsRoutes extends BaseRoutes {
    readonly router = Router()

    constructor() {
        super()

        this.router.get("/", requireSession, this.bind(this.list))
        this.router.post("/", requireSession, this.bind(this.create))
        this.router.patch("/:orgId", requireSession, this.bind(this.update))
        this.router.delete("/:orgId", requireSession, this.bind(this.remove))
    }

    private async list(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const data = await OrganizationsService.listMyOrganizations(auth.userId)
        http.ok(res, data)
    }

    private async create(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const body = createOrganizationSchema.parse(req.body)
        const data = await OrganizationsService.createOrganization(auth.userId, body)
        http.ok(res, data, 201)
    }

    private async update(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const { orgId } = orgIdParamsSchema.parse(req.params)
        const body = updateOrganizationSchema.parse(req.body)
        const data = await OrganizationsService.updateOrganization(orgId, auth.userId, body)
        http.ok(res, data)
    }

    private async remove(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const { orgId } = orgIdParamsSchema.parse(req.params)
        const data = await OrganizationsService.deleteOrganization(orgId, auth.userId)
        http.ok(res, data)
    }
}

export default new OrganizationsRoutes()

import { Router } from "express"
import type { Request, Response } from "express"
import requireSession from "../../middleware/requireSession.js"
import { BaseRoutes } from "../../platform/BaseRoutes.js"
import http from "../../platform/http.js"
import organizationsService from "./service.js"

class OrganizationsRoutes extends BaseRoutes {
    readonly router = Router()

    constructor() {
        super()

        this.router.get("/", requireSession, this.bind(this.list))
    }

    private async list(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const data = await organizationsService.listMyOrganizations(auth.userId)
        http.ok(res, data)
    }
}

export default new OrganizationsRoutes()

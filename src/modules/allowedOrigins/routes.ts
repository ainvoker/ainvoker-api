import { Router } from "express"
import type { Request, Response } from "express"
import requireSession from "../../middleware/requireSession.js"
import { BaseRoutes } from "../../platform/BaseRoutes.js"
import http from "../../platform/http.js"
import { projectIdParamsSchema } from "../projects/schemas.js"
import { allowedOriginParamsSchema, createAllowedOriginSchema } from "./schemas.js"
import AllowedOriginsService from "./service.js"

class AllowedOriginsRoutes extends BaseRoutes {
    readonly router = Router()

    constructor() {
        super()

        this.router.get(
            "/projects/:projectId/allowed-origins",
            requireSession,
            this.bind(this.list),
        )
        this.router.post(
            "/projects/:projectId/allowed-origins",
            requireSession,
            this.bind(this.create),
        )
        this.router.delete(
            "/projects/:projectId/allowed-origins/:originId",
            requireSession,
            this.bind(this.remove),
        )
    }

    private async list(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const { projectId } = projectIdParamsSchema.parse(req.params)
        const data = await AllowedOriginsService.list(projectId, auth.userId)
        http.ok(res, data)
    }

    private async create(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const { projectId } = projectIdParamsSchema.parse(req.params)
        const body = createAllowedOriginSchema.parse(req.body)
        const data = await AllowedOriginsService.create(projectId, auth.userId, body)
        http.ok(res, data, 201)
    }

    private async remove(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const { projectId, originId } = allowedOriginParamsSchema.parse(req.params)
        await AllowedOriginsService.remove(projectId, originId, auth.userId)
        http.ok(res, { deleted: true })
    }
}

export default new AllowedOriginsRoutes()

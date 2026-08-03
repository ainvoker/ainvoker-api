import { Router } from "express"
import type { Request, Response } from "express"
import requireSession from "../../middleware/requireSession.js"
import { BaseRoutes } from "../../platform/BaseRoutes.js"
import http from "../../platform/http.js"
import { bootstrapProfileSchema, updateProfileSchema } from "./schemas.js"
import usersService from "./service.js"

class UsersRoutes extends BaseRoutes {
    readonly router = Router()

    constructor() {
        super()

        this.router.get("/me", requireSession, this.bind(this.getMe))
        this.router.post("/me/bootstrap", requireSession, this.bind(this.bootstrapMe))
        this.router.patch("/me", requireSession, this.bind(this.updateMe))
    }

    private async getMe(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const data = await usersService.getMe(auth.userId)
        http.ok(res, data)
    }

    /** Create app User + default Personal org (idempotent). Seeds profile on first create. */
    private async bootstrapMe(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const body = bootstrapProfileSchema.parse(req.body ?? {})
        const data = await usersService.getMe(auth.userId, body)
        http.ok(res, data)
    }

    private async updateMe(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const body = updateProfileSchema.parse(req.body)
        const data = await usersService.updateProfile(auth.userId, body)
        http.ok(res, data)
    }
}

export default new UsersRoutes()

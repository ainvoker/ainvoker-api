import type { NextFunction, Request, Response } from "express"
import env from "../config/env.js"
import { AppError } from "../platform/errors.js"

class PlatformAdminMiddleware {
    constructor() {
        this.handle = this.handle.bind(this)
    }

    handle(req: Request, _res: Response, next: NextFunction) {
        if (!req.auth) {
            next(new AppError(401, "UNAUTHORIZED", "Authentication required"))
            return
        }
        if (!env.isPlatformAdmin(req.auth.userId)) {
            next(new AppError(403, "FORBIDDEN", "Platform admin access required"))
            return
        }
        next()
    }
}

export default new PlatformAdminMiddleware().handle

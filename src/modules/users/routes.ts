import { Router } from "express";
import type { Request, Response } from "express";
import requireSession from "../../middleware/requireSession.js";
import { BaseRoutes } from "../../platform/BaseRoutes.js";
import http from "../../platform/http.js";
import usersService from "./service.js";

class UsersRoutes extends BaseRoutes {
    readonly router = Router();

    constructor() {
        super();

        this.router.get("/me", requireSession, this.bind(this.getMe));
    }

    private async getMe(req: Request, res: Response) {
        const auth = this.requireAuth(req);
        const data = await usersService.getMe(auth.userId);
        http.ok(res, data);
    }
}

export default new UsersRoutes();

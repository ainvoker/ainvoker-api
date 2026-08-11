import { Router } from "express";
import requireSession from "../../middleware/requireSession.js";
import { BaseRoutes } from "../../platform/BaseRoutes.js";
import http from "../../platform/http.js";
import { bootstrapProfileSchema, updateProfileSchema } from "./schemas.js";
import UsersService from "./service.js";
class UsersRoutes extends BaseRoutes {
    router = Router();
    constructor() {
        super();
        this.router.get("/me", requireSession, this.bind(this.getMe));
        this.router.post("/me/bootstrap", requireSession, this.bind(this.bootstrapMe));
        this.router.patch("/me", requireSession, this.bind(this.updateMe));
    }
    async getMe(req, res) {
        const auth = this.requireAuth(req);
        const data = await UsersService.getMe(auth.userId);
        http.ok(res, data);
    }
    /** Create app User + default Personal org (idempotent). Seeds profile on first create. */
    async bootstrapMe(req, res) {
        const auth = this.requireAuth(req);
        const body = bootstrapProfileSchema.parse(req.body ?? {});
        const data = await UsersService.getMe(auth.userId, body);
        http.ok(res, data);
    }
    async updateMe(req, res) {
        const auth = this.requireAuth(req);
        const body = updateProfileSchema.parse(req.body);
        const data = await UsersService.updateProfile(auth.userId, body);
        http.ok(res, data);
    }
}
export default new UsersRoutes();
//# sourceMappingURL=routes.js.map
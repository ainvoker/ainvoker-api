import { Router } from "express";
import requireSession from "../../middleware/requireSession.js";
import { BaseRoutes } from "../../platform/BaseRoutes.js";
import http from "../../platform/http.js";
import organizationsService from "./service.js";
class OrganizationsRoutes extends BaseRoutes {
    router = Router();
    constructor() {
        super();
        this.router.get("/", requireSession, this.bind(this.list));
    }
    async list(req, res) {
        const auth = this.requireAuth(req);
        const data = await organizationsService.listMyOrganizations(auth.userId);
        http.ok(res, data);
    }
}
export default new OrganizationsRoutes();
//# sourceMappingURL=routes.js.map
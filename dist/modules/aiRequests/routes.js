import { Router } from "express";
import requireSession from "../../middleware/requireSession.js";
import { BaseRoutes } from "../../platform/BaseRoutes.js";
import http from "../../platform/http.js";
import { aiRequestParamsSchema, listAiRequestsQuerySchema, projectIdParamsSchema, } from "./schemas.js";
import aiRequestsService from "./service.js";
class AiRequestsRoutes extends BaseRoutes {
    router = Router();
    constructor() {
        super();
        this.router.get("/projects/:projectId/ai-requests", requireSession, this.bind(this.list));
        this.router.get("/projects/:projectId/ai-requests/:requestId", requireSession, this.bind(this.getOne));
    }
    async list(req, res) {
        const auth = this.requireAuth(req);
        const { projectId } = projectIdParamsSchema.parse(req.params);
        const query = listAiRequestsQuerySchema.parse(req.query);
        const data = await aiRequestsService.listAiRequests(projectId, auth.userId, query);
        http.ok(res, data);
    }
    async getOne(req, res) {
        const auth = this.requireAuth(req);
        const { projectId, requestId } = aiRequestParamsSchema.parse(req.params);
        const data = await aiRequestsService.getAiRequest(projectId, requestId, auth.userId);
        http.ok(res, data);
    }
}
export default new AiRequestsRoutes();
//# sourceMappingURL=routes.js.map
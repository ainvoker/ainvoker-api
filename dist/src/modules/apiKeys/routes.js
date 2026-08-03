import { Router } from "express";
import requireSession from "../../middleware/requireSession.js";
import { BaseRoutes } from "../../platform/BaseRoutes.js";
import http from "../../platform/http.js";
import { apiKeyParamsSchema, createApiKeySchema, projectIdParamsSchema } from "./schemas.js";
import apiKeysService from "./service.js";
class ApiKeysRoutes extends BaseRoutes {
    router = Router();
    constructor() {
        super();
        this.router.get("/projects/:projectId/api-keys", requireSession, this.bind(this.list));
        this.router.post("/projects/:projectId/api-keys", requireSession, this.bind(this.create));
        this.router.post("/projects/:projectId/api-keys/:keyId/revoke", requireSession, this.bind(this.revoke));
        this.router.delete("/projects/:projectId/api-keys/:keyId", requireSession, this.bind(this.remove));
    }
    async list(req, res) {
        const auth = this.requireAuth(req);
        const { projectId } = projectIdParamsSchema.parse(req.params);
        const data = await apiKeysService.listApiKeys(projectId, auth.userId);
        http.ok(res, data);
    }
    async create(req, res) {
        const auth = this.requireAuth(req);
        const { projectId } = projectIdParamsSchema.parse(req.params);
        const body = createApiKeySchema.parse(req.body);
        const data = await apiKeysService.createApiKey(projectId, auth.userId, body);
        http.ok(res, data, 201);
    }
    async revoke(req, res) {
        const auth = this.requireAuth(req);
        const { projectId, keyId } = apiKeyParamsSchema.parse(req.params);
        const data = await apiKeysService.revokeApiKey(projectId, keyId, auth.userId);
        http.ok(res, data);
    }
    async remove(req, res) {
        const auth = this.requireAuth(req);
        const { projectId, keyId } = apiKeyParamsSchema.parse(req.params);
        await apiKeysService.deleteApiKey(projectId, keyId, auth.userId);
        http.ok(res, { deleted: true });
    }
}
export default new ApiKeysRoutes();
//# sourceMappingURL=routes.js.map
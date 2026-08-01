import { Router } from "express";
import { requireSession } from "../../middleware/requireSession.js";
import { AppError } from "../../platform/errors.js";
import { asyncHandler, ok } from "../../platform/http.js";
import { apiKeyParamsSchema, createApiKeySchema, projectIdParamsSchema } from "./schemas.js";
import * as apiKeysService from "./service.js";
export const apiKeysRouter = Router();
apiKeysRouter.get("/projects/:projectId/api-keys", requireSession, asyncHandler(async (req, res) => {
    if (!req.auth) {
        throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const { projectId } = projectIdParamsSchema.parse(req.params);
    const data = await apiKeysService.listApiKeys(projectId, req.auth.userId);
    ok(res, data);
}));
apiKeysRouter.post("/projects/:projectId/api-keys", requireSession, asyncHandler(async (req, res) => {
    if (!req.auth) {
        throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const { projectId } = projectIdParamsSchema.parse(req.params);
    const body = createApiKeySchema.parse(req.body);
    const data = await apiKeysService.createApiKey(projectId, req.auth.userId, body);
    ok(res, data, 201);
}));
apiKeysRouter.post("/projects/:projectId/api-keys/:keyId/revoke", requireSession, asyncHandler(async (req, res) => {
    if (!req.auth) {
        throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const { projectId, keyId } = apiKeyParamsSchema.parse(req.params);
    const data = await apiKeysService.revokeApiKey(projectId, keyId, req.auth.userId);
    ok(res, data);
}));
apiKeysRouter.delete("/projects/:projectId/api-keys/:keyId", requireSession, asyncHandler(async (req, res) => {
    if (!req.auth) {
        throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const { projectId, keyId } = apiKeyParamsSchema.parse(req.params);
    await apiKeysService.deleteApiKey(projectId, keyId, req.auth.userId);
    ok(res, { deleted: true });
}));
//# sourceMappingURL=routes.js.map
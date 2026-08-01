import { Router } from "express";
import { requireOrgMember } from "../../middleware/requireOrgMember.js";
import { requireSession } from "../../middleware/requireSession.js";
import { AppError } from "../../platform/errors.js";
import { asyncHandler, ok } from "../../platform/http.js";
import { createProjectSchema, projectIdParamsSchema, updateProjectSchema } from "./schemas.js";
import * as projectsService from "./service.js";
export const projectsRouter = Router();
projectsRouter.get("/organizations/:orgId/projects", requireSession, requireOrgMember, asyncHandler(async (req, res) => {
    if (!req.auth) {
        throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const orgId = req.params.orgId;
    const data = await projectsService.listProjects(orgId, req.auth.userId);
    ok(res, data);
}));
projectsRouter.post("/organizations/:orgId/projects", requireSession, requireOrgMember, asyncHandler(async (req, res) => {
    if (!req.auth) {
        throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const orgId = req.params.orgId;
    const body = createProjectSchema.parse(req.body);
    const data = await projectsService.createProject(orgId, req.auth.userId, body);
    ok(res, data, 201);
}));
projectsRouter.get("/projects/:projectId", requireSession, asyncHandler(async (req, res) => {
    if (!req.auth) {
        throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const { projectId } = projectIdParamsSchema.parse(req.params);
    const data = await projectsService.getProject(projectId, req.auth.userId);
    ok(res, data);
}));
projectsRouter.patch("/projects/:projectId", requireSession, asyncHandler(async (req, res) => {
    if (!req.auth) {
        throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const { projectId } = projectIdParamsSchema.parse(req.params);
    const body = updateProjectSchema.parse(req.body);
    const data = await projectsService.updateProject(projectId, req.auth.userId, body);
    ok(res, data);
}));
projectsRouter.delete("/projects/:projectId", requireSession, asyncHandler(async (req, res) => {
    if (!req.auth) {
        throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const { projectId } = projectIdParamsSchema.parse(req.params);
    await projectsService.deleteProject(projectId, req.auth.userId);
    ok(res, { deleted: true });
}));
//# sourceMappingURL=routes.js.map
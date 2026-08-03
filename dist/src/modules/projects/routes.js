import { Router } from "express";
import requireOrgMember from "../../middleware/requireOrgMember.js";
import requireSession from "../../middleware/requireSession.js";
import { BaseRoutes } from "../../platform/BaseRoutes.js";
import http from "../../platform/http.js";
import { createProjectSchema, projectIdParamsSchema, updateProjectSchema } from "./schemas.js";
import projectsService from "./service.js";
class ProjectsRoutes extends BaseRoutes {
    router = Router();
    constructor() {
        super();
        this.router.get("/organizations/:orgId/projects", requireSession, requireOrgMember, this.bind(this.list));
        this.router.post("/organizations/:orgId/projects", requireSession, requireOrgMember, this.bind(this.create));
        this.router.get("/projects/:projectId", requireSession, this.bind(this.getOne));
        this.router.patch("/projects/:projectId", requireSession, this.bind(this.update));
        this.router.delete("/projects/:projectId", requireSession, this.bind(this.remove));
    }
    async list(req, res) {
        const auth = this.requireAuth(req);
        const orgId = req.params.orgId;
        const data = await projectsService.listProjects(orgId, auth.userId);
        http.ok(res, data);
    }
    async create(req, res) {
        const auth = this.requireAuth(req);
        const orgId = req.params.orgId;
        const body = createProjectSchema.parse(req.body);
        const data = await projectsService.createProject(orgId, auth.userId, body);
        http.ok(res, data, 201);
    }
    async getOne(req, res) {
        const auth = this.requireAuth(req);
        const { projectId } = projectIdParamsSchema.parse(req.params);
        const data = await projectsService.getProject(projectId, auth.userId);
        http.ok(res, data);
    }
    async update(req, res) {
        const auth = this.requireAuth(req);
        const { projectId } = projectIdParamsSchema.parse(req.params);
        const body = updateProjectSchema.parse(req.body);
        const data = await projectsService.updateProject(projectId, auth.userId, body);
        http.ok(res, data);
    }
    async remove(req, res) {
        const auth = this.requireAuth(req);
        const { projectId } = projectIdParamsSchema.parse(req.params);
        await projectsService.deleteProject(projectId, auth.userId);
        http.ok(res, { deleted: true });
    }
}
export default new ProjectsRoutes();
//# sourceMappingURL=routes.js.map
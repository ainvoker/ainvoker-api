import { Router } from "express"
import type { Request, Response } from "express"
import requireSession from "../../middleware/requireSession.js"
import { BaseRoutes } from "../../platform/BaseRoutes.js"
import http from "../../platform/http.js"
import { projectIdParamsSchema } from "../projects/schemas.js"
import projectModelsService, {
    projectModelParamsSchema,
    toggleProjectModelSchema,
} from "./projectModels.js"

class ProjectModelsRoutes extends BaseRoutes {
    readonly router = Router()

    constructor() {
        super()

        this.router.get(
            "/projects/:projectId/models",
            requireSession,
            this.bind(this.list),
        )
        this.router.patch(
            "/projects/:projectId/models/:modelId",
            requireSession,
            this.bind(this.toggle),
        )
    }

    private async list(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const { projectId } = projectIdParamsSchema.parse(req.params)
        const data = await projectModelsService.list(projectId, auth.userId)
        http.ok(res, data)
    }

    private async toggle(req: Request, res: Response) {
        const auth = this.requireAuth(req)
        const { projectId, modelId } = projectModelParamsSchema.parse(req.params)
        const body = toggleProjectModelSchema.parse(req.body)
        const data = await projectModelsService.toggle(projectId, modelId, auth.userId, body)
        http.ok(res, data)
    }
}

export default new ProjectModelsRoutes()

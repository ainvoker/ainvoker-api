import { Router } from "express"
import allowedOriginsRoutes from "../modules/allowedOrigins/routes.js"
import apiKeysRoutes from "../modules/apiKeys/routes.js"
import aiRequestsRoutes from "../modules/aiRequests/routes.js"
import billingRoutes from "../modules/billing/routes.js"
import organizationsRoutes from "../modules/organizations/routes.js"
import projectsRoutes from "../modules/projects/routes.js"
import usersRoutes from "../modules/users/routes.js"

class ApiV1Routes {
    readonly router = Router()

    constructor() {
        this.router.use(usersRoutes.router)
        this.router.use(billingRoutes.router)
        this.router.use("/organizations", organizationsRoutes.router)
        this.router.use(projectsRoutes.router)
        this.router.use(apiKeysRoutes.router)
        this.router.use(allowedOriginsRoutes.router)
        this.router.use(aiRequestsRoutes.router)
    }
}

export default new ApiV1Routes()

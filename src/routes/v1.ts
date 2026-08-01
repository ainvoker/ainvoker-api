import { Router } from "express";
import apiKeysRoutes from "../modules/apiKeys/routes.js";
import organizationsRoutes from "../modules/organizations/routes.js";
import projectsRoutes from "../modules/projects/routes.js";
import usersRoutes from "../modules/users/routes.js";

class ApiV1Routes {
    readonly router = Router();

    constructor() {
        this.router.use(usersRoutes.router);
        this.router.use("/organizations", organizationsRoutes.router);
        this.router.use(projectsRoutes.router);
        this.router.use(apiKeysRoutes.router);
    }
}

export default new ApiV1Routes();

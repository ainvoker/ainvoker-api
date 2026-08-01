import { Router } from "express";
import { apiKeysRouter } from "../modules/apiKeys/routes.js";
import { organizationsRouter } from "../modules/organizations/routes.js";
import { projectsRouter } from "../modules/projects/routes.js";
import { usersRouter } from "../modules/users/routes.js";
export const apiV1Router = Router();
apiV1Router.use(usersRouter);
apiV1Router.use("/organizations", organizationsRouter);
apiV1Router.use(projectsRouter);
apiV1Router.use(apiKeysRouter);
//# sourceMappingURL=v1.js.map
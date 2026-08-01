import { Router } from "express";
import { requireSession } from "../../middleware/requireSession.js";
import { AppError } from "../../platform/errors.js";
import { asyncHandler, ok } from "../../platform/http.js";
import * as organizationsService from "./service.js";
export const organizationsRouter = Router();
organizationsRouter.get("/", requireSession, asyncHandler(async (req, res) => {
    if (!req.auth) {
        throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const data = await organizationsService.listMyOrganizations(req.auth.userId);
    ok(res, data);
}));
//# sourceMappingURL=routes.js.map
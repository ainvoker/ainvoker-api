import { Router } from "express";
import { requireSession } from "../../middleware/requireSession.js";
import { AppError } from "../../platform/errors.js";
import { asyncHandler, ok } from "../../platform/http.js";
import * as usersService from "./service.js";
export const usersRouter = Router();
usersRouter.get("/me", requireSession, asyncHandler(async (req, res) => {
    if (!req.auth) {
        throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    const data = await usersService.getMe(req.auth.userId);
    ok(res, data);
}));
//# sourceMappingURL=routes.js.map
import { AppError } from "./errors.js";
import http from "./http.js";
export class BaseRoutes {
    requireAuth(req) {
        if (!req.auth) {
            throw new AppError(401, "UNAUTHORIZED", "Authentication required");
        }
        return req.auth;
    }
    bind(handler) {
        return http.asyncHandler(handler.bind(this));
    }
}
//# sourceMappingURL=BaseRoutes.js.map
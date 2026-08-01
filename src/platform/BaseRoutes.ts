import type { Request, RequestHandler, Response } from "express";
import { AppError } from "./errors.js";
import http from "./http.js";

export abstract class BaseRoutes {
    protected requireAuth(req: Request): { userId: string } {
        if (!req.auth) {
            throw new AppError(401, "UNAUTHORIZED", "Authentication required");
        }
        return req.auth;
    }

    protected bind(handler: (req: Request, res: Response) => Promise<void>): RequestHandler {
        return http.asyncHandler(handler.bind(this));
    }
}

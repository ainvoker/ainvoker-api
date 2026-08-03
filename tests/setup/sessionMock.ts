import type { NextFunction, Request, Response } from "express";
import { vi } from "vitest";
import { AppError } from "../../src/platform/errors.js";

vi.mock("../../src/middleware/requireSession.js", () => ({
    default: (req: Request, _res: Response, next: NextFunction) => {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer ")) {
            next(new AppError(401, "UNAUTHORIZED", "Missing or invalid Authorization header"));
            return;
        }

        const token = header.slice("Bearer ".length).trim();
        if (!token) {
            next(new AppError(401, "UNAUTHORIZED", "Missing bearer token"));
            return;
        }

        req.auth = { userId: token };
        next();
    },
}));

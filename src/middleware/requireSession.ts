import { createRemoteJWKSet, jwtVerify } from "jose";
import type { NextFunction, Request, Response } from "express";
import env from "../config/env.js";
import { AppError } from "../platform/errors.js";

class SessionMiddleware {
    private readonly jwks = createRemoteJWKSet(
        new URL("/.well-known/jwks.json", env.NEON_AUTH_URL),
    );
    private readonly issuer = new URL(env.NEON_AUTH_URL).origin;

    constructor() {
        this.handle = this.handle.bind(this);
    }

    async handle(req: Request, _res: Response, next: NextFunction) {
        try {
            const header = req.headers.authorization;
            if (!header?.startsWith("Bearer ")) {
                throw new AppError(401, "UNAUTHORIZED", "Missing or invalid Authorization header");
            }

            const token = header.slice("Bearer ".length).trim();
            if (!token) {
                throw new AppError(401, "UNAUTHORIZED", "Missing bearer token");
            }

            const { payload } = await jwtVerify(token, this.jwks, { issuer: this.issuer });
            if (!payload.sub) {
                throw new AppError(401, "UNAUTHORIZED", "Token missing subject");
            }

            req.auth = { userId: payload.sub };
            next();
        } catch (err) {
            if (err instanceof AppError) {
                next(err);
                return;
            }
            next(new AppError(401, "UNAUTHORIZED", "Invalid or expired token"));
        }
    }
}

export default new SessionMiddleware().handle;

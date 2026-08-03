import { createRemoteJWKSet, jwtVerify } from "jose";
import type { NextFunction, Request, Response } from "express";
import env from "../config/env.js";
import { AppError } from "../platform/errors.js";

function looksLikeJwt(token: string) {
    return token.split(".").length === 3;
}

/** Join under NEON_AUTH_URL without dropping `/neondb/auth` (absolute `/...` paths would). */
function neonAuthUrl(path: string) {
    const base = env.NEON_AUTH_URL.endsWith("/") ? env.NEON_AUTH_URL : `${env.NEON_AUTH_URL}/`;
    return new URL(path.replace(/^\//, ""), base);
}

class SessionMiddleware {
    private readonly jwks = createRemoteJWKSet(neonAuthUrl(".well-known/jwks.json"));
    private readonly issuer = new URL(env.NEON_AUTH_URL).origin;

    constructor() {
        this.handle = this.handle.bind(this);
    }

    private async verifyJwt(token: string): Promise<string | null> {
        try {
            const { payload } = await jwtVerify(token, this.jwks, { issuer: this.issuer });
            return typeof payload.sub === "string" ? payload.sub : null;
        } catch (err) {
            if (env.NODE_ENV !== "production") {
                console.error("[requireSession] JWT verify failed:", err);
            }
            return null;
        }
    }

    /** Validate Better Auth / Neon opaque session token via get-session (Bearer). */
    private async verifySessionToken(token: string): Promise<string | null> {
        try {
            const res = await fetch(neonAuthUrl("get-session"), {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (!res.ok) {
                if (env.NODE_ENV !== "production") {
                    console.error("[requireSession] get-session failed:", res.status);
                }
                return null;
            }

            const data = (await res.json()) as {
                user?: { id?: string };
                session?: { userId?: string };
            } | null;

            return data?.user?.id ?? data?.session?.userId ?? null;
        } catch (err) {
            if (env.NODE_ENV !== "production") {
                console.error("[requireSession] get-session error:", err);
            }
            return null;
        }
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

            const userId = looksLikeJwt(token)
                ? await this.verifyJwt(token)
                : await this.verifySessionToken(token);

            if (!userId) {
                throw new AppError(401, "UNAUTHORIZED", "Invalid or expired token");
            }

            req.auth = { userId };
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

import { createRemoteJWKSet, jwtVerify } from "jose";
import env from "../config/env.js";
import { AppError } from "../platform/errors.js";
function looksLikeJwt(token) {
    return token.split(".").length === 3;
}
/** Join under NEON_AUTH_URL without dropping `/neondb/auth` (absolute `/...` paths would). */
function neonAuthUrl(path) {
    const base = env.NEON_AUTH_URL.endsWith("/") ? env.NEON_AUTH_URL : `${env.NEON_AUTH_URL}/`;
    return new URL(path.replace(/^\//, ""), base);
}
class SessionMiddleware {
    jwks = createRemoteJWKSet(neonAuthUrl(".well-known/jwks.json"));
    issuer = new URL(env.NEON_AUTH_URL).origin;
    constructor() {
        this.handle = this.handle.bind(this);
    }
    async verifyJwt(token) {
        try {
            const { payload } = await jwtVerify(token, this.jwks, { issuer: this.issuer });
            return typeof payload.sub === "string" ? payload.sub : null;
        }
        catch (err) {
            if (env.NODE_ENV !== "production") {
                console.error("[requireSession] JWT verify failed:", err);
            }
            return null;
        }
    }
    /** Validate Better Auth / Neon opaque session token via get-session (Bearer). */
    async verifySessionToken(token) {
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
            const data = (await res.json());
            return data?.user?.id ?? data?.session?.userId ?? null;
        }
        catch (err) {
            if (env.NODE_ENV !== "production") {
                console.error("[requireSession] get-session error:", err);
            }
            return null;
        }
    }
    async handle(req, _res, next) {
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
        }
        catch (err) {
            if (err instanceof AppError) {
                next(err);
                return;
            }
            next(new AppError(401, "UNAUTHORIZED", "Invalid or expired token"));
        }
    }
}
export default new SessionMiddleware().handle;
//# sourceMappingURL=requireSession.js.map
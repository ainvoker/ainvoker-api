import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env.js";
import { AppError } from "../platform/errors.js";
const jwksUrl = new URL("/.well-known/jwks.json", env.NEON_AUTH_URL);
const JWKS = createRemoteJWKSet(jwksUrl);
const issuer = new URL(env.NEON_AUTH_URL).origin;
export async function requireSession(req, _res, next) {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer ")) {
            throw new AppError(401, "UNAUTHORIZED", "Missing or invalid Authorization header");
        }
        const token = header.slice("Bearer ".length).trim();
        if (!token) {
            throw new AppError(401, "UNAUTHORIZED", "Missing bearer token");
        }
        const { payload } = await jwtVerify(token, JWKS, { issuer });
        if (!payload.sub) {
            throw new AppError(401, "UNAUTHORIZED", "Token missing subject");
        }
        req.auth = { userId: payload.sub };
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
//# sourceMappingURL=requireSession.js.map
import env from "../config/env.js";
class MiddlewareHelpers {
    looksLikeJwt(token) {
        return token.split(".").length === 3;
    }
    neonAuthUrl(path) {
        const base = env.NEON_AUTH_URL.endsWith("/") ? env.NEON_AUTH_URL : `${env.NEON_AUTH_URL}/`;
        return new URL(path.replace(/^\//, ""), base);
    }
}
export default new MiddlewareHelpers();
//# sourceMappingURL=middleware.js.map
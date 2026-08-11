import { Router } from "express";
import requireApiKey from "../../middleware/requireApiKey.js";
import { BaseRoutes } from "../../platform/BaseRoutes.js";
import { AppError } from "../../platform/errors.js";
import http from "../../platform/http.js";
import { textChatSchema } from "./schemas.js";
import textService from "./service.js";
function setRateLimitHeaders(res, quota) {
    if (quota.requestLimit > 0) {
        res.setHeader("X-RateLimit-Limit-Requests", String(quota.requestLimit));
        res.setHeader("X-RateLimit-Remaining-Requests", String(Math.max(0, quota.requestLimit - quota.requestsUsed - 1)));
    }
    if (quota.tokenLimit > 0) {
        res.setHeader("X-RateLimit-Limit-Tokens", String(quota.tokenLimit));
        res.setHeader("X-RateLimit-Remaining-Tokens", String(Math.max(0, quota.tokenLimit - quota.tokensUsed)));
    }
}
class TextRoutes extends BaseRoutes {
    router = Router();
    constructor() {
        super();
        this.router.post("/chat", requireApiKey, this.bind(this.chat));
    }
    requireApiKeyContext(req) {
        if (!req.apiKeyContext) {
            throw new AppError(401, "UNAUTHORIZED", "API key required");
        }
        return req.apiKeyContext;
    }
    async chat(req, res) {
        const apiKeyContext = this.requireApiKeyContext(req);
        const body = textChatSchema.parse(req.body);
        const { quota, ...data } = await textService.chat(apiKeyContext, body);
        setRateLimitHeaders(res, quota);
        http.ok(res, data);
    }
}
export default new TextRoutes();
//# sourceMappingURL=routes.js.map
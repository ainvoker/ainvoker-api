import { Router } from "express";
import env from "../../config/env.js";
import requireSession from "../../middleware/requireSession.js";
import requireOrgMember from "../../middleware/requireOrgMember.js";
import { BaseRoutes } from "../../platform/BaseRoutes.js";
import http from "../../platform/http.js";
import { createCheckoutSessionSchema } from "./schemas.js";
import BillingService from "./service.js";
class BillingRoutes extends BaseRoutes {
    router = Router();
    constructor() {
        super();
        this.router.get("/organizations/:orgId/subscription", requireSession, requireOrgMember, this.bind(this.getSubscription));
        this.router.post("/organizations/:orgId/checkout-sessions", requireSession, requireOrgMember, this.bind(this.createCheckoutSession));
        this.router.post("/billing/webhooks/xendit", this.bind(this.xenditWebhook));
    }
    async getSubscription(req, res) {
        const orgId = req.params.orgId;
        const data = await BillingService.getOrganizationSubscription(orgId);
        http.ok(res, data);
    }
    async createCheckoutSession(req, res) {
        const auth = this.requireAuth(req);
        const orgId = req.params.orgId;
        const body = createCheckoutSessionSchema.parse(req.body);
        const membership = req.membership;
        const returnUrl = body.returnUrl ??
            `${env.CORS_ORIGIN}/billing/checkout?orgId=${orgId}&plan=pro&resume=1`;
        const data = await BillingService.createProCheckoutSession({
            organizationId: orgId,
            userId: auth.userId,
            roleName: membership.role.name,
            returnUrl,
        });
        http.ok(res, data, 201);
    }
    async xenditWebhook(req, res) {
        const token = req.headers["x-callback-token"];
        const result = await BillingService.handleXenditWebhook(req.body, token);
        http.ok(res, result);
    }
}
export default new BillingRoutes();
//# sourceMappingURL=routes.js.map
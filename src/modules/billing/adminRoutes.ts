import { Router } from "express"
import type { Request, Response } from "express"
import requirePlatformAdmin from "../../middleware/requirePlatformAdmin.js"
import requireSession from "../../middleware/requireSession.js"
import { BaseRoutes } from "../../platform/BaseRoutes.js"
import http from "../../platform/http.js"
import adminBillingService from "./adminService.js"
import {
    adminSubscriptionParamsSchema,
    listAdminSubscriptionsQuerySchema,
    listAdminTransactionsQuerySchema,
    updateAdminSubscriptionSchema,
} from "./adminSchemas.js"

class AdminBillingRoutes extends BaseRoutes {
    readonly router = Router()

    constructor() {
        super()

        this.router.use(requireSession, requirePlatformAdmin)
        this.router.get("/plans", this.bind(this.listPlans))
        this.router.get("/subscriptions", this.bind(this.listSubscriptions))
        this.router.patch("/subscriptions/:subscriptionId", this.bind(this.updateSubscription))
        this.router.get("/transactions", this.bind(this.listTransactions))
    }

    private async listPlans(_req: Request, res: Response) {
        const data = await adminBillingService.listPlans()
        http.ok(res, data)
    }

    private async listSubscriptions(req: Request, res: Response) {
        const query = listAdminSubscriptionsQuerySchema.parse(req.query)
        const data = await adminBillingService.listSubscriptions(query)
        http.ok(res, data)
    }

    private async listTransactions(req: Request, res: Response) {
        const query = listAdminTransactionsQuerySchema.parse(req.query)
        const data = await adminBillingService.listTransactions(query)
        http.ok(res, data)
    }

    private async updateSubscription(req: Request, res: Response) {
        const { subscriptionId } = adminSubscriptionParamsSchema.parse(req.params)
        const body = updateAdminSubscriptionSchema.parse(req.body)
        const auth = this.requireAuth(req)
        const data = await adminBillingService.updateSubscription(subscriptionId, body, auth.userId)
        http.ok(res, data)
    }
}

export default new AdminBillingRoutes()

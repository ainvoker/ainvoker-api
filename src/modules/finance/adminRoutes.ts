import { Router } from "express"
import type { Request, Response } from "express"
import requirePlatformAdmin from "../../middleware/requirePlatformAdmin.js"
import requireSession from "../../middleware/requireSession.js"
import { BaseRoutes } from "../../platform/BaseRoutes.js"
import http from "../../platform/http.js"
import adminFinanceService from "./adminService.js"
import {
    createFinanceExpenseSchema,
    financeExpenseParamsSchema,
    financePeriodQuerySchema,
    financeReconciliationUploadSchema,
    listFinanceExpensesQuerySchema,
    updateFinanceExpenseSchema,
} from "./adminSchemas.js"

class AdminFinanceRoutes extends BaseRoutes {
    readonly router = Router()

    constructor() {
        super()

        this.router.use(requireSession, requirePlatformAdmin)
        this.router.get("/finance/overview", this.bind(this.getOverview))
        this.router.get("/finance/margin-by-plan", this.bind(this.getMarginByPlan))
        this.router.get("/finance/expenses", this.bind(this.listExpenses))
        this.router.post("/finance/expenses", this.bind(this.createExpense))
        this.router.patch("/finance/expenses/:expenseId", this.bind(this.updateExpense))
        this.router.get("/finance/reconciliation/xendit", this.bind(this.getXenditRecon))
        this.router.post("/finance/reconciliation/xendit", this.bind(this.uploadXenditRecon))
        this.router.get("/finance/reconciliation/providers", this.bind(this.getProviderRecon))
        this.router.post("/finance/reconciliation/providers", this.bind(this.uploadProviderRecon))
    }

    private async getOverview(req: Request, res: Response) {
        const query = financePeriodQuerySchema.parse(req.query)
        const data = await adminFinanceService.getOverview(query)
        http.ok(res, data)
    }

    private async getMarginByPlan(req: Request, res: Response) {
        const query = financePeriodQuerySchema.parse(req.query)
        const data = await adminFinanceService.getMarginByPlan(query)
        http.ok(res, data)
    }

    private async listExpenses(req: Request, res: Response) {
        const query = listFinanceExpensesQuerySchema.parse(req.query)
        const data = await adminFinanceService.listExpenses(query)
        http.ok(res, data)
    }

    private async createExpense(req: Request, res: Response) {
        const body = createFinanceExpenseSchema.parse(req.body)
        const data = await adminFinanceService.createExpense(body)
        http.ok(res, data)
    }

    private async updateExpense(req: Request, res: Response) {
        const { expenseId } = financeExpenseParamsSchema.parse(req.params)
        const body = updateFinanceExpenseSchema.parse(req.body)
        const data = await adminFinanceService.updateExpense(expenseId, body)
        http.ok(res, data)
    }

    private async getXenditRecon(req: Request, res: Response) {
        const query = financePeriodQuerySchema.parse(req.query)
        const data = await adminFinanceService.getXenditReconciliation(query)
        http.ok(res, data)
    }

    private async uploadXenditRecon(req: Request, res: Response) {
        const body = financeReconciliationUploadSchema.parse(req.body)
        const data = await adminFinanceService.uploadXenditReconciliation(body)
        http.ok(res, data)
    }

    private async getProviderRecon(req: Request, res: Response) {
        const query = financePeriodQuerySchema.parse(req.query)
        const data = await adminFinanceService.getProviderReconciliation(query)
        http.ok(res, data)
    }

    private async uploadProviderRecon(req: Request, res: Response) {
        const body = financeReconciliationUploadSchema.parse(req.body)
        const data = await adminFinanceService.uploadProviderReconciliation(body)
        http.ok(res, data)
    }
}

export default new AdminFinanceRoutes()

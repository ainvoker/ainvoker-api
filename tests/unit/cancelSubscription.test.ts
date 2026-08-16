import { beforeEach, describe, expect, it, vi } from "vitest"
import { AppError } from "../../src/platform/errors.js"

const {
    prisma,
    deactivateXenditRecurringPlan,
    getPlanByName,
    expireLapsedSubscriptions,
} = vi.hoisted(() => ({
    prisma: {
        subscription: {
            findFirst: vi.fn(),
            update: vi.fn(),
        },
        organization: {
            findUniqueOrThrow: vi.fn(),
        },
        transaction: {
            findMany: vi.fn(),
        },
    },
    deactivateXenditRecurringPlan: vi.fn(),
    getPlanByName: vi.fn(),
    expireLapsedSubscriptions: vi.fn(),
}))

vi.mock("../../src/platform/prisma.js", () => ({
    default: prisma,
}))

vi.mock("../../src/config/env.js", () => ({
    default: {
        BILLING_ENABLED: true,
        getXenditComponentsOrigins: () => ["https://localhost:5173"],
        XENDIT_WEBHOOK_TOKEN: "whsec",
        getClientOrigin: () => "http://localhost:5173",
    },
}))

vi.mock("../../src/modules/billing/catalog.js", () => ({
    ensureBillingCatalog: vi.fn().mockResolvedValue(undefined),
    getPlanByName,
    getProCheckoutAmountPhp: () => 109900,
    PLAN_NAMES: { free: "free", pro: "pro", scale: "scale" },
}))

vi.mock("../../src/modules/billing/limits.js", () => ({
    expireLapsedSubscriptions,
}))

vi.mock("../../src/modules/billing/xendit/client.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../src/modules/billing/xendit/client.js")>()
    return {
        ...actual,
        deactivateXenditRecurringPlan,
    }
})

import BillingService from "../../src/modules/billing/service.js"

describe("cancelOrganizationSubscription", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getPlanByName.mockResolvedValue({ id: "plan_pro" })
        expireLapsedSubscriptions.mockResolvedValue(undefined)
        deactivateXenditRecurringPlan.mockResolvedValue(undefined)
    })

    it("deactivates Xendit plan and sets cancelAtPeriodEnd while keeping ACTIVE", async () => {
        const expiresAt = new Date(Date.now() + 10 * 86_400_000)
        prisma.subscription.findFirst.mockResolvedValue({
            id: "sub_1",
            cancelAtPeriodEnd: false,
            expiresAt,
            xenditRecurringPlanId: "repl_1",
            status: "ACTIVE",
        })
        prisma.subscription.update.mockResolvedValue({
            id: "sub_1",
            expiresAt,
            cancelAtPeriodEnd: true,
        })

        const result = await BillingService.cancelOrganizationSubscription({
            organizationId: "org_1",
            roleName: "owner",
        })

        expect(deactivateXenditRecurringPlan).toHaveBeenCalledWith("repl_1")
        expect(prisma.subscription.update).toHaveBeenCalledWith({
            where: { id: "sub_1" },
            data: {
                cancelAtPeriodEnd: true,
                canceledAt: expect.any(Date),
            },
        })
        expect(result.cancelAtPeriodEnd).toBe(true)
        expect(result.alreadyCanceled).toBe(false)
        expect(result.expiresAt).toBe(expiresAt.toISOString())
    })

    it("is idempotent when already canceling at period end", async () => {
        const expiresAt = new Date(Date.now() + 10 * 86_400_000)
        prisma.subscription.findFirst.mockResolvedValue({
            id: "sub_1",
            cancelAtPeriodEnd: true,
            expiresAt,
            xenditRecurringPlanId: "repl_1",
            status: "ACTIVE",
        })

        const result = await BillingService.cancelOrganizationSubscription({
            organizationId: "org_1",
            roleName: "admin",
        })

        expect(deactivateXenditRecurringPlan).not.toHaveBeenCalled()
        expect(result.alreadyCanceled).toBe(true)
    })

    it("rejects members who are not owners or admins", async () => {
        await expect(
            BillingService.cancelOrganizationSubscription({
                organizationId: "org_1",
                roleName: "member",
            }),
        ).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" })
    })

    it("rejects when there is no active paid plan", async () => {
        prisma.subscription.findFirst.mockResolvedValue(null)
        await expect(
            BillingService.cancelOrganizationSubscription({
                organizationId: "org_1",
                roleName: "owner",
            }),
        ).rejects.toBeInstanceOf(AppError)
    })
})

describe("listOrganizationInvoices", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("maps transactions to invoice rows", async () => {
        prisma.transaction.findMany.mockResolvedValue([
            {
                id: "tx_1",
                createdAt: new Date("2026-08-01T00:00:00.000Z"),
                description: "AInvoker Pro — first payment",
                paymentStatus: "SUCCEEDED",
                amount: { toString: () => "1099" },
                receiptUrl: "https://example.com/receipt",
                referenceNumber: "pay_1",
                subscription: { plan: { name: "pro" } },
            },
        ])

        const rows = await BillingService.listOrganizationInvoices("org_1", "owner")
        expect(rows).toEqual([
            {
                id: "tx_1",
                date: "2026-08-01T00:00:00.000Z",
                description: "AInvoker Pro — first payment",
                status: "paid",
                amount: "1099",
                currency: "PHP",
                receiptUrl: "https://example.com/receipt",
                referenceNumber: "pay_1",
            },
        ])
    })
})

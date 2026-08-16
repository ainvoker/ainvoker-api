import { beforeEach, describe, expect, it, vi } from "vitest"
import { proRenewsAt } from "../../src/modules/billing/period.js"

const { prisma, getPlanByName } = vi.hoisted(() => ({
    prisma: {
        transaction: { findUnique: vi.fn(), create: vi.fn() },
        subscription: {
            findFirst: vi.fn(),
            updateMany: vi.fn(),
            update: vi.fn(),
        },
        organization: { update: vi.fn() },
        $transaction: vi.fn(),
    },
    getPlanByName: vi.fn(),
}))

vi.mock("../../src/platform/prisma.js", () => ({
    default: prisma,
}))

vi.mock("../../src/modules/billing/catalog.js", () => ({
    ensureBillingCatalog: vi.fn().mockResolvedValue(undefined),
    getPlanByName,
    PLAN_NAMES: { free: "free", pro: "pro", scale: "scale" },
}))

import { activateProSubscription, renewProSubscription } from "../../src/modules/billing/activate.js"

describe("activateProSubscription renewal window", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getPlanByName.mockResolvedValue({ id: "plan_pro" })
        prisma.transaction.findUnique.mockResolvedValue(null)
        prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<void>) =>
            fn(prisma),
        )
        prisma.subscription.findFirst.mockResolvedValue({
            id: "sub_pending",
            organizationId: "org_1",
        })
        prisma.subscription.updateMany.mockResolvedValue({ count: 0 })
        prisma.subscription.update.mockResolvedValue({})
        prisma.transaction.create.mockResolvedValue({})
    })

    it("sets expiresAt one calendar month after startedAt", async () => {
        const before = Date.now()
        await activateProSubscription({
            organizationId: "org_1",
            paymentReference: "pay_1",
            amountPhp: 109900,
        })
        const after = Date.now()

        const update = prisma.subscription.update.mock.calls[0][0] as {
            data: { startedAt: Date; expiresAt: Date; status: string }
        }
        expect(update.data.status).toBe("ACTIVE")
        const expected = proRenewsAt(update.data.startedAt).getTime()
        expect(update.data.expiresAt.getTime()).toBe(expected)
        expect(update.data.startedAt.getTime()).toBeGreaterThanOrEqual(before)
        expect(update.data.startedAt.getTime()).toBeLessThanOrEqual(after)
    })
})

describe("renewProSubscription", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getPlanByName.mockResolvedValue({ id: "plan_pro" })
        prisma.transaction.findUnique.mockResolvedValue(null)
        prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<void>) =>
            fn(prisma),
        )
        prisma.subscription.update.mockResolvedValue({})
        prisma.transaction.create.mockResolvedValue({})
    })

    it("extends expiresAt and writes a paid invoice", async () => {
        const currentExpiry = new Date(Date.now() + 86_400_000)
        prisma.subscription.findFirst.mockResolvedValue({
            id: "sub_active",
            organizationId: "org_1",
            expiresAt: currentExpiry,
            status: "ACTIVE",
        })

        await renewProSubscription({
            organizationId: "org_1",
            paymentReference: "cycle_1",
            amountPhp: 109900,
            description: "AInvoker Pro — renewal",
        })

        const update = prisma.subscription.update.mock.calls[0][0] as {
            data: { expiresAt: Date; status: string; cancelAtPeriodEnd: boolean }
        }
        expect(update.data.status).toBe("ACTIVE")
        expect(update.data.cancelAtPeriodEnd).toBe(false)
        expect(update.data.expiresAt.getTime()).toBe(proRenewsAt(currentExpiry).getTime())

        expect(prisma.transaction.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                subscriptionId: "sub_active",
                referenceNumber: "cycle_1",
                paymentStatus: "SUCCEEDED",
                description: "AInvoker Pro — renewal",
            }),
        })
    })

    it("is idempotent on duplicate payment reference", async () => {
        prisma.transaction.findUnique.mockResolvedValue({ id: "tx_existing" })
        const result = await renewProSubscription({
            organizationId: "org_1",
            paymentReference: "cycle_dup",
            amountPhp: 109900,
        })
        expect(result.alreadyProcessed).toBe(true)
        expect(prisma.$transaction).not.toHaveBeenCalled()
    })
})

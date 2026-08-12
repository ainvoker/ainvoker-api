import { beforeEach, describe, expect, it, vi } from "vitest"
import { PRO_PREPAID_MS } from "../../src/modules/billing/period.js"

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

import { activateProSubscription } from "../../src/modules/billing/activate.js"

describe("activateProSubscription prepaid window", () => {
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

    it("sets expiresAt 30 days after startedAt", async () => {
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
        const delta = update.data.expiresAt.getTime() - update.data.startedAt.getTime()
        expect(delta).toBe(PRO_PREPAID_MS)
        expect(update.data.startedAt.getTime()).toBeGreaterThanOrEqual(before)
        expect(update.data.startedAt.getTime()).toBeLessThanOrEqual(after)
    })
})

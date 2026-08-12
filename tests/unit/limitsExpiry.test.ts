import { beforeEach, describe, expect, it, vi } from "vitest"
import { AppError } from "../../src/platform/errors.js"

const { prisma, getPlanByName } = vi.hoisted(() => ({
    prisma: {
        subscription: {
            findFirst: vi.fn(),
            updateMany: vi.fn(),
            update: vi.fn(),
            create: vi.fn(),
        },
        organization: { findUnique: vi.fn() },
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

import { getActiveSubscriptionWithPlan } from "../../src/modules/billing/limits.js"

const future = new Date(Date.now() + 86_400_000)

describe("getActiveSubscriptionWithPlan expiry", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getPlanByName.mockResolvedValue({ id: "plan_free" })
        prisma.subscription.updateMany.mockResolvedValue({ count: 0 })
        prisma.organization.findUnique.mockResolvedValue({ slug: "paid-workspace" })
    })

    it("returns an unexpired ACTIVE subscription", async () => {
        const active = {
            id: "sub_1",
            status: "ACTIVE",
            expiresAt: future,
            plan: { name: "pro" },
        }
        prisma.subscription.findFirst.mockResolvedValue(active)

        await expect(getActiveSubscriptionWithPlan("org_1")).resolves.toEqual(active)
    })

    it("grandfathers ACTIVE Pro with null expiresAt", async () => {
        const active = {
            id: "sub_1",
            status: "ACTIVE",
            expiresAt: null,
            plan: { name: "pro" },
        }
        prisma.subscription.findFirst.mockResolvedValue(active)

        await expect(getActiveSubscriptionWithPlan("org_1")).resolves.toEqual(active)
    })

    it("expires a lapsed Pro and throws when no other ACTIVE remains", async () => {
        prisma.subscription.updateMany.mockResolvedValue({ count: 1 })
        prisma.subscription.findFirst.mockResolvedValue(null)

        try {
            await getActiveSubscriptionWithPlan("org_1")
            expect.unreachable()
        } catch (err) {
            expect(err).toBeInstanceOf(AppError)
            expect((err as AppError).status).toBe(402)
            expect((err as AppError).code).toBe("SUBSCRIPTION_REQUIRED")
        }

        expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
            where: {
                organizationId: "org_1",
                status: "ACTIVE",
                expiresAt: { lte: expect.any(Date) },
            },
            data: { status: "EXPIRED" },
        })
    })
})

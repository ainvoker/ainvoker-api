import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import env from "../../src/config/env.js"
import { getPlanByName, PLAN_NAMES } from "../../src/modules/billing/catalog.js"
import prismaClient from "../../src/platform/prisma.js"
import { cleanupTestUser, seedUserWithPersonalOrg, testUserId } from "../helpers/db.js"

const { createXenditSession, getXenditSession } = vi.hoisted(() => ({
    createXenditSession: vi.fn(),
    getXenditSession: vi.fn(),
}))

vi.mock("../../src/modules/billing/xendit/client.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../src/modules/billing/xendit/client.js")>()
    return {
        ...actual,
        createXenditSession,
        getXenditSession,
    }
})

import BillingService from "../../src/modules/billing/service.js"

describe("createProCheckoutSession concurrency (integration)", () => {
    let userId: string
    let organizationId: string
    let billingWasEnabled: boolean

    beforeEach(async () => {
        userId = testUserId()
        const seeded = await seedUserWithPersonalOrg(userId, {
            email: `${userId}@example.com`,
            firstName: "Test",
            lastName: "User",
        })
        organizationId = seeded.organizationId

        billingWasEnabled = env.BILLING_ENABLED
        ;(env as { BILLING_ENABLED: boolean }).BILLING_ENABLED = true

        createXenditSession.mockReset()
        getXenditSession.mockReset()
        getXenditSession.mockResolvedValue(null)
    })

    afterEach(async () => {
        ;(env as { BILLING_ENABLED: boolean }).BILLING_ENABLED = billingWasEnabled
        await cleanupTestUser(userId)
    })

    it("serializes overlapping checkouts across short org locks without holding FOR UPDATE during Xendit HTTP", async () => {
        const futureExpires = new Date(Date.now() + 20 * 60 * 1000).toISOString()
        const futureAnchor = new Date(Date.now() + 30 * 86_400_000).toISOString()

        let releaseCreate!: () => void
        const createGate = new Promise<void>((resolve) => {
            releaseCreate = resolve
        })
        let resolveInFlight!: () => void
        const inFlight = new Promise<void>((resolve) => {
            resolveInFlight = resolve
        })

        createXenditSession.mockImplementation(async () => {
            resolveInFlight()
            await createGate
            return {
                payment_session_id: "ps_integration",
                components_sdk_key: "sdk_integration",
                expires_at: futureExpires,
                status: "ACTIVE",
                customer_id: "cust_integration",
                subscription: {
                    schedule: { anchor_date: futureAnchor },
                },
            }
        })

        getXenditSession.mockImplementation(async (sessionId: string) => {
            if (sessionId !== "ps_integration") return null
            return {
                payment_session_id: "ps_integration",
                components_sdk_key: "sdk_integration",
                expires_at: futureExpires,
                status: "ACTIVE",
                customer_id: "cust_integration",
                subscription: {
                    schedule: { anchor_date: futureAnchor },
                },
            }
        })

        const checkoutInput = {
            organizationId,
            userId,
            roleName: "owner",
            returnUrl: `https://localhost:5173/billing/checkout?orgId=${organizationId}&resume=1`,
        }

        const first = BillingService.createProCheckoutSession(checkoutInput)
        await inFlight

        const proPlan = await getPlanByName(PLAN_NAMES.pro)
        const pendingDuringHttp = await prismaClient.subscription.findFirst({
            where: {
                organizationId,
                planId: proPlan.id,
                status: "PENDING",
            },
            orderBy: { createdAt: "desc" },
        })
        expect(pendingDuringHttp?.xenditSessionId).toMatch(/^claim:/)

        // Row lock must not be held across Xendit HTTP — NOWAIT must succeed.
        await prismaClient.$transaction(async (tx) => {
            const nowait = await tx.$queryRaw<Array<{ id: string }>>`
                SELECT id FROM "Organization" WHERE id = ${organizationId} FOR UPDATE NOWAIT
            `
            expect(nowait).toHaveLength(1)
        })

        const second = BillingService.createProCheckoutSession(checkoutInput)
        await new Promise((r) => setTimeout(r, 50))
        releaseCreate()

        const [a, b] = await Promise.all([first, second])
        expect(a.sessionId).toBe("ps_integration")
        expect(b.sessionId).toBe("ps_integration")
        expect(createXenditSession).toHaveBeenCalledOnce()

        const pendingRows = await prismaClient.subscription.findMany({
            where: {
                organizationId,
                planId: proPlan.id,
                status: "PENDING",
            },
        })
        expect(pendingRows).toHaveLength(1)
        expect(pendingRows[0]?.xenditSessionId).toBe("ps_integration")
    })
})

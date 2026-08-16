import { describe, expect, it } from "vitest"
import { activateProSubscription } from "../../src/modules/billing/activate.js"
import { PLAN_NAMES } from "../../src/modules/billing/catalog.js"
import prismaClient from "../../src/platform/prisma.js"
import { useTestAuthUser } from "../helpers/fixtures.js"

describe("activateProSubscription", () => {
    const authUser = useTestAuthUser()

    it("activates a pending Pro subscription idempotently", async () => {
        const org = await prismaClient.organization.create({
            data: {
                name: "Pay Test Org",
                slug: `pay-test-${Date.now()}`,
                createdByUserId: authUser.auth.userId,
            },
        })

        const proPlan = await prismaClient.plan.findUniqueOrThrow({
            where: { name: PLAN_NAMES.pro },
        })

        const pending = await prismaClient.subscription.create({
            data: {
                organizationId: org.id,
                planId: proPlan.id,
                status: "PENDING",
                startedAt: new Date(),
            },
        })

        const reference = `test_pay_${Date.now()}`

        const first = await activateProSubscription({
            organizationId: org.id,
            paymentReference: reference,
            paymentTokenId: "pt_test_token",
            amountPhp: 109900,
        })
        expect(first.activated).toBe(true)

        const active = await prismaClient.subscription.findUniqueOrThrow({
            where: { id: pending.id },
            include: { plan: true },
        })
        expect(active.status).toBe("ACTIVE")
        expect(active.plan.name).toBe(PLAN_NAMES.pro)
        expect(active.expiresAt).not.toBeNull()
        if (active.expiresAt) {
            const days =
                (active.expiresAt.getTime() - active.startedAt.getTime()) / 86_400_000
            expect(days).toBeGreaterThanOrEqual(28)
            expect(days).toBeLessThanOrEqual(31)
        }

        const orgRow = await prismaClient.organization.findUniqueOrThrow({
            where: { id: org.id },
        })
        expect(orgRow.xenditPaymentTokenId).toBe("pt_test_token")

        const second = await activateProSubscription({
            organizationId: org.id,
            paymentReference: reference,
            amountPhp: 109900,
        })
        expect(second.alreadyProcessed).toBe(true)

        await prismaClient.transaction.deleteMany({
            where: { subscriptionId: pending.id },
        })
        await prismaClient.subscription.delete({ where: { id: pending.id } })
        await prismaClient.organization.delete({ where: { id: org.id } })
    })
})

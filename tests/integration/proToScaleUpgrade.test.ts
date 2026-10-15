import { afterEach, describe, expect, it, vi } from "vitest"

const deactivateMock = vi.hoisted(() => vi.fn(async () => {}))

vi.mock("../../src/modules/billing/xendit/client.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../src/modules/billing/xendit/client.js")>()
    return { ...actual, deactivateXenditRecurringPlan: deactivateMock }
})

import { activateScaleSubscription } from "../../src/modules/billing/activate.js"
import {
    getProCheckoutAmountPhp,
    getScaleCheckoutAmountPhp,
    PLAN_NAMES,
} from "../../src/modules/billing/catalog.js"
import { previewScaleUpgrade } from "../../src/modules/billing/proration.js"
import prismaClient from "../../src/platform/prisma.js"
import { useTestAuthUser } from "../helpers/fixtures.js"

const DAY_MS = 86_400_000

describe("Pro to Scale upgrade", () => {
    const authUser = useTestAuthUser()
    const orgIds: string[] = []

    afterEach(async () => {
        deactivateMock.mockClear()
        for (const id of orgIds.splice(0)) {
            await prismaClient.transaction.deleteMany({
                where: { subscription: { organizationId: id } },
            })
            await prismaClient.subscription.deleteMany({ where: { organizationId: id } })
            await prismaClient.organization.delete({ where: { id } })
        }
    })

    async function createProOrgWithPendingScale() {
        const org = await prismaClient.organization.create({
            data: {
                name: "Upgrade Org",
                slug: `upgrade-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                createdByUserId: authUser.auth.userId,
            },
        })
        orgIds.push(org.id)

        const [proPlan, scalePlan] = await Promise.all([
            prismaClient.plan.findUniqueOrThrow({ where: { name: PLAN_NAMES.pro } }),
            prismaClient.plan.findUniqueOrThrow({ where: { name: PLAN_NAMES.scale } }),
        ])
        const now = Date.now()
        const pro = await prismaClient.subscription.create({
            data: {
                organizationId: org.id,
                planId: proPlan.id,
                status: "ACTIVE",
                startedAt: new Date(now - 10 * DAY_MS),
                expiresAt: new Date(now + 20 * DAY_MS),
                xenditRecurringPlanId: `rp_test_${org.id}`,
            },
        })
        const scale = await prismaClient.subscription.create({
            data: {
                organizationId: org.id,
                planId: scalePlan.id,
                status: "PENDING",
                startedAt: new Date(now),
            },
        })
        return { org, pro, scale }
    }

    it("previews the wallet advance plus unused Pro credit", async () => {
        const { org } = await createProOrgWithPendingScale()

        const preview = await previewScaleUpgrade(org.id)

        const proPhp = getProCheckoutAmountPhp() / 100
        expect(preview.hasActivePro).toBe(true)
        expect(preview.advancePhp).toBe(getScaleCheckoutAmountPhp() / 100)
        expect(preview.proCreditPhp).toBeGreaterThan(proPhp * 0.62)
        expect(preview.proCreditPhp).toBeLessThan(proPhp * 0.68)
        expect(preview.totalWalletCreditPhp).toBeCloseTo(preview.advancePhp + preview.proCreditPhp)
    })

    it("cancels Pro, stops its recurring plan, and credits the wallet with proration", async () => {
        const { org, pro, scale } = await createProOrgWithPendingScale()
        const reference = `scale_upgrade_${Date.now()}`

        const result = await activateScaleSubscription({
            organizationId: org.id,
            paymentReference: reference,
            amountPhp: 49900,
        })
        expect(result.activated).toBe(true)

        expect(deactivateMock).toHaveBeenCalledWith(pro.xenditRecurringPlanId)

        const [proAfter, scaleAfter, orgAfter] = await Promise.all([
            prismaClient.subscription.findUniqueOrThrow({ where: { id: pro.id } }),
            prismaClient.subscription.findUniqueOrThrow({ where: { id: scale.id } }),
            prismaClient.organization.findUniqueOrThrow({ where: { id: org.id } }),
        ])
        expect(proAfter.status).toBe("CANCELED")
        expect(scaleAfter.status).toBe("ACTIVE")

        const credit = orgAfter.scaleWalletBalanceCentavos - 49900
        // 20 of ~30 days remain on the Pro period.
        expect(credit).toBeGreaterThan(getProCheckoutAmountPhp() * 0.62)
        expect(credit).toBeLessThan(getProCheckoutAmountPhp() * 0.68)

        const again = await activateScaleSubscription({
            organizationId: org.id,
            paymentReference: reference,
            amountPhp: 49900,
        })
        expect(again.alreadyProcessed).toBe(true)
        const orgFinal = await prismaClient.organization.findUniqueOrThrow({ where: { id: org.id } })
        expect(orgFinal.scaleWalletBalanceCentavos).toBe(orgAfter.scaleWalletBalanceCentavos)
    })
})

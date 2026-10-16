import request from "supertest"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import app from "../../src/app.js"
import env from "../../src/config/env.js"
import { ensureBillingCatalog, getPlanByName, PLAN_NAMES } from "../../src/modules/billing/catalog.js"
import prismaClient from "../../src/platform/prisma.js"
import { useTestAuthUser } from "../helpers/fixtures.js"

describe("admin billing endpoints", () => {
    const authUser = useTestAuthUser({
        profile: {
            email: "admin-billing@example.com",
            firstName: "Admin",
            lastName: "Billing",
        },
    })

    beforeEach(async () => {
        vi.spyOn(env, "isPlatformAdmin").mockImplementation(
            (userId) => userId === authUser.auth.userId,
        )
        await ensureBillingCatalog()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express).get("/api/v1/admin/plans")
        expect(res.status).toBe(401)
    })

    it("returns 403 for users who are not platform admins", async () => {
        vi.spyOn(env, "isPlatformAdmin").mockReturnValue(false)
        const res = await request(app.express)
            .get("/api/v1/admin/plans")
            .set(authUser.headers())
        expect(res.status).toBe(403)
        expect(res.body.error.code).toBe("FORBIDDEN")
    })

    it("lists plans read-only", async () => {
        const res = await request(app.express)
            .get("/api/v1/admin/plans")
            .set(authUser.headers())
        expect(res.status).toBe(200)
        const plans = res.body.data as Array<{
            name: string
            monthlyPrice: string
            priceNote: string | null
        }>
        const names = plans.map((p) => p.name)
        expect(names).toEqual(expect.arrayContaining(["free", "pro", "scale"]))
        const pro = plans.find((p) => p.name === "pro")
        expect(pro?.priceNote).toBe("per month")
        expect(Number(pro?.monthlyPrice)).toBe(499)
        expect(plans.find((p) => p.name === "scale")).toMatchObject({
            monthlyPrice: "499.00",
            priceNote: "wallet advance",
        })
    })

    it("lists subscriptions for the seeded org", async () => {
        const res = await request(app.express)
            .get("/api/v1/admin/subscriptions")
            .query({ q: authUser.auth.organizationId })
            .set(authUser.headers())
        expect(res.status).toBe(200)
        expect(res.body.data.total).toBeGreaterThanOrEqual(1)
        expect(res.body.data.items).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    organization: expect.objectContaining({ id: authUser.auth.organizationId }),
                    planName: "free",
                    status: "ACTIVE",
                }),
            ]),
        )
    })

    it("lists transactions (empty for new org)", async () => {
        const res = await request(app.express)
            .get("/api/v1/admin/transactions")
            .query({ q: authUser.auth.organizationId })
            .set(authUser.headers())
        expect(res.status).toBe(200)
        expect(res.body.data).toMatchObject({
            items: [],
            total: 0,
            limit: 50,
            offset: 0,
        })
    })

    it("grants Pro, extends it, then cancels at period end", async () => {
        const freeSub = await prismaClient.subscription.findFirstOrThrow({
            where: {
                organizationId: authUser.auth.organizationId,
                status: "ACTIVE",
            },
            orderBy: { startedAt: "desc" },
        })

        const granted = await request(app.express)
            .patch(`/api/v1/admin/subscriptions/${freeSub.id}`)
            .set(authUser.headers())
            .send({ action: "grant_pro" })
        expect(granted.status).toBe(200)
        expect(granted.body.data).toMatchObject({
            id: freeSub.id,
            planName: PLAN_NAMES.pro,
            status: "ACTIVE",
            cancelAtPeriodEnd: false,
            xenditRecurringPlanId: null,
        })
        expect(granted.body.data.expiresAt).toBeTruthy()

        const beforeExtend = new Date(granted.body.data.expiresAt as string)
        const extended = await request(app.express)
            .patch(`/api/v1/admin/subscriptions/${freeSub.id}`)
            .set(authUser.headers())
            .send({ action: "extend_pro", days: 14 })
        expect(extended.status).toBe(200)
        const afterExtend = new Date(extended.body.data.expiresAt as string)
        expect(afterExtend.getTime() - beforeExtend.getTime()).toBe(14 * 24 * 60 * 60 * 1000)

        const canceled = await request(app.express)
            .patch(`/api/v1/admin/subscriptions/${freeSub.id}`)
            .set(authUser.headers())
            .send({ action: "cancel", atPeriodEnd: true })
        expect(canceled.status).toBe(200)
        expect(canceled.body.data).toMatchObject({
            id: freeSub.id,
            status: "ACTIVE",
            cancelAtPeriodEnd: true,
        })
    })

    it("cancels immediately when atPeriodEnd is false", async () => {
        const proPlan = await getPlanByName(PLAN_NAMES.pro)
        const sub = await prismaClient.subscription.create({
            data: {
                organizationId: authUser.auth.organizationId,
                planId: proPlan.id,
                status: "ACTIVE",
                startedAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        })

        const res = await request(app.express)
            .patch(`/api/v1/admin/subscriptions/${sub.id}`)
            .set(authUser.headers())
            .send({ action: "cancel", atPeriodEnd: false })
        expect(res.status).toBe(200)
        expect(res.body.data).toMatchObject({
            id: sub.id,
            status: "CANCELED",
            cancelAtPeriodEnd: false,
        })
    })

    it("rejects extend_pro on Free", async () => {
        const freePlan = await getPlanByName(PLAN_NAMES.free)
        const sub = await prismaClient.subscription.create({
            data: {
                organizationId: authUser.auth.organizationId,
                planId: freePlan.id,
                status: "ACTIVE",
                startedAt: new Date(),
            },
        })

        const res = await request(app.express)
            .patch(`/api/v1/admin/subscriptions/${sub.id}`)
            .set(authUser.headers())
            .send({ action: "extend_pro", days: 7 })
        expect(res.status).toBe(409)
        expect(res.body.error.code).toBe("NOT_PRO")
    })
})

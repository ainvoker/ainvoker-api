import { beforeEach, describe, expect, it, vi } from "vitest"
import { AppError } from "../../src/platform/errors.js"

const {
    prisma,
    createXenditSession,
    getXenditSession,
    findXenditCustomerByReference,
    getPlanByName,
} = vi.hoisted(() => ({
    prisma: {
        user: { findUnique: vi.fn() },
        organization: {
            findUniqueOrThrow: vi.fn(),
            update: vi.fn(),
        },
        subscription: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
        },
    },
    createXenditSession: vi.fn(),
    getXenditSession: vi.fn(),
    findXenditCustomerByReference: vi.fn(),
    getPlanByName: vi.fn(),
}))

vi.mock("../../src/platform/prisma.js", () => ({
    default: prisma,
}))

vi.mock("../../src/config/env.js", () => ({
    default: {
        BILLING_ENABLED: true,
        getXenditComponentsOrigins: () => ["https://localhost:5173"],
    },
}))

vi.mock("../../src/modules/billing/catalog.js", () => ({
    ensureBillingCatalog: vi.fn().mockResolvedValue(undefined),
    getPlanByName,
    getProCheckoutAmountPhp: () => 109900,
    PLAN_NAMES: { free: "free", pro: "pro", scale: "scale" },
}))

vi.mock("../../src/modules/billing/limits.js", () => ({
    expireLapsedSubscriptions: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("../../src/modules/billing/xendit/client.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../src/modules/billing/xendit/client.js")>()
    return {
        ...actual,
        createXenditSession,
        getXenditSession,
        findXenditCustomerByReference,
    }
})

import BillingService from "../../src/modules/billing/service.js"

type OrgRow = {
    id: string
    xenditCustomerReference: string | null
    xenditCustomerId: string | null
}

function setupPrisma(
    org: OrgRow,
    pending: { id: string; xenditSessionId: string | null },
    activePro: { id: string; expiresAt: Date | null } | null = null,
) {
    prisma.user.findUnique.mockResolvedValue({
        id: "user_1",
        email: "a@example.com",
        firstName: "Ada",
        lastName: "Lovelace",
    })
    getPlanByName.mockResolvedValue({ id: "plan_pro" })
    prisma.organization.findUniqueOrThrow.mockImplementation(async () => ({ ...org }))
    prisma.organization.update.mockImplementation(async ({ data }: { data: Partial<OrgRow> }) => {
        Object.assign(org, data)
        return { ...org }
    })
    prisma.subscription.findFirst.mockImplementation(
        async (args: { where?: { status?: string } }) => {
            if (args.where?.status === "ACTIVE") {
                return activePro
                    ? { ...activePro, organizationId: org.id, planId: "plan_pro" }
                    : null
            }
            return {
                id: pending.id,
                organizationId: org.id,
                xenditSessionId: pending.xenditSessionId,
            }
        },
    )
    prisma.subscription.update.mockResolvedValue({})
    prisma.subscription.updateMany.mockResolvedValue({ count: 0 })
}

const checkoutInput = {
    organizationId: "org_abc",
    userId: "user_1",
    roleName: "owner",
    returnUrl: "http://localhost:5173/billing/checkout?orgId=org_abc&resume=1",
}

describe("createProCheckoutSession", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        findXenditCustomerByReference.mockResolvedValue(null)
        getXenditSession.mockResolvedValue(null)
        createXenditSession.mockResolvedValue({
            payment_session_id: "ps_1",
            components_sdk_key: "sdk_key",
            expires_at: "2026-08-12T10:00:00.000Z",
            status: "ACTIVE",
            customer_id: "cust-new-1",
        })
    })

    it("sends nested customer on first checkout and persists customer_id", async () => {
        const org: OrgRow = {
            id: "org_abc",
            xenditCustomerReference: null,
            xenditCustomerId: null,
        }
        setupPrisma(org, { id: "sub_1", xenditSessionId: null })

        const result = await BillingService.createProCheckoutSession(checkoutInput)

        expect(result.sessionId).toBe("ps_1")
        expect(createXenditSession).toHaveBeenCalledOnce()
        const body = createXenditSession.mock.calls[0][0] as Record<string, unknown>
        expect(body.customer).toMatchObject({
            reference_id: "org_org_abc",
            type: "INDIVIDUAL",
        })
        expect(body).not.toHaveProperty("customer_id")
        expect(body.allow_save_payment_method).toBe("DISABLED")
        expect(prisma.organization.update).toHaveBeenCalledWith({
            where: { id: "org_abc" },
            data: { xenditCustomerId: "cust-new-1" },
        })
    })

    it("reuses customer_id on later checkout", async () => {
        const org: OrgRow = {
            id: "org_abc",
            xenditCustomerReference: "org_org_abc",
            xenditCustomerId: "cust-b98d6f63-d240-44ec-9bd5-aa42954c4f48",
        }
        setupPrisma(org, { id: "sub_1", xenditSessionId: null })

        await BillingService.createProCheckoutSession(checkoutInput)

        expect(findXenditCustomerByReference).not.toHaveBeenCalled()
        const body = createXenditSession.mock.calls[0][0] as Record<string, unknown>
        expect(body.customer_id).toBe("cust-b98d6f63-d240-44ec-9bd5-aa42954c4f48")
        expect(body).not.toHaveProperty("customer")
    })

    it("looks up an existing Xendit customer when org is stuck with reference only", async () => {
        const org: OrgRow = {
            id: "org_abc",
            xenditCustomerReference: "org_org_abc",
            xenditCustomerId: null,
        }
        setupPrisma(org, { id: "sub_1", xenditSessionId: null })
        findXenditCustomerByReference.mockResolvedValue({
            id: "cust-from-lookup",
            reference_id: "org_org_abc",
        })

        await BillingService.createProCheckoutSession(checkoutInput)

        expect(findXenditCustomerByReference).toHaveBeenCalledWith("org_org_abc")
        const body = createXenditSession.mock.calls[0][0] as Record<string, unknown>
        expect(body.customer_id).toBe("cust-from-lookup")
        expect(body).not.toHaveProperty("customer")
    })

    it("retries once with customer_id after duplicate reference_id error", async () => {
        const org: OrgRow = {
            id: "org_abc",
            xenditCustomerReference: "org_org_abc",
            xenditCustomerId: null,
        }
        setupPrisma(org, { id: "sub_1", xenditSessionId: null })
        findXenditCustomerByReference
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                id: "cust-after-dup",
                reference_id: "org_org_abc",
            })
        createXenditSession
            .mockRejectedValueOnce(
                new AppError(
                    502,
                    "PAYMENT_PROVIDER_ERROR",
                    "customer: The reference_id entered has been used before. Please enter a unique reference_id",
                ),
            )
            .mockResolvedValueOnce({
                payment_session_id: "ps_retry",
                components_sdk_key: "sdk_retry",
                customer_id: "cust-after-dup",
            })

        const result = await BillingService.createProCheckoutSession(checkoutInput)

        expect(result.sessionId).toBe("ps_retry")
        expect(createXenditSession).toHaveBeenCalledTimes(2)
        const first = createXenditSession.mock.calls[0][0] as Record<string, unknown>
        const second = createXenditSession.mock.calls[1][0] as Record<string, unknown>
        expect(first).toHaveProperty("customer")
        expect(first).not.toHaveProperty("customer_id")
        expect(second.customer_id).toBe("cust-after-dup")
        expect(second).not.toHaveProperty("customer")
    })

    it("reuses an ACTIVE Xendit session instead of creating another", async () => {
        const org: OrgRow = {
            id: "org_abc",
            xenditCustomerReference: "org_org_abc",
            xenditCustomerId: "cust-existing",
        }
        setupPrisma(org, { id: "sub_1", xenditSessionId: "ps_active" })
        getXenditSession.mockResolvedValue({
            payment_session_id: "ps_active",
            components_sdk_key: "sdk_active",
            status: "ACTIVE",
            customer_id: "cust-existing",
            expires_at: "2026-08-12T10:00:00.000Z",
        })

        const result = await BillingService.createProCheckoutSession(checkoutInput)

        expect(result).toEqual({
            componentsSdkKey: "sdk_active",
            sessionId: "ps_active",
            expiresAt: "2026-08-12T10:00:00.000Z",
        })
        expect(createXenditSession).not.toHaveBeenCalled()
    })

    it("rejects checkout while unexpired Pro is active", async () => {
        const org: OrgRow = {
            id: "org_abc",
            xenditCustomerReference: "org_org_abc",
            xenditCustomerId: "cust-existing",
        }
        setupPrisma(
            org,
            { id: "sub_pending", xenditSessionId: null },
            { id: "sub_active", expiresAt: new Date(Date.now() + 86_400_000) },
        )

        await expect(BillingService.createProCheckoutSession(checkoutInput)).rejects.toMatchObject({
            status: 409,
            code: "ALREADY_ACTIVE",
        })
        expect(createXenditSession).not.toHaveBeenCalled()
    })

    it("allows renew checkout after Pro expires", async () => {
        const org: OrgRow = {
            id: "org_abc",
            xenditCustomerReference: "org_org_abc",
            xenditCustomerId: "cust-existing",
        }
        setupPrisma(
            org,
            { id: "sub_pending", xenditSessionId: null },
            { id: "sub_active", expiresAt: new Date(Date.now() - 1000) },
        )

        await BillingService.createProCheckoutSession(checkoutInput)
        expect(createXenditSession).toHaveBeenCalledOnce()
    })
})

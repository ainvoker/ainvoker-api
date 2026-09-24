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
            findUnique: vi.fn(),
            findUniqueOrThrow: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
        },
        $queryRaw: vi.fn().mockResolvedValue([{ id: "org_abc" }]),
        $transaction: vi.fn(),
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

type PendingRow = {
    id: string
    organizationId: string
    planId: string
    status: "PENDING"
    xenditSessionId: string | null
    createdAt: Date
}

function setupPrisma(
    org: OrgRow,
    pending: { id: string; xenditSessionId: string | null },
    activePro: { id: string; expiresAt: Date | null } | null = null,
) {
    const pendingRow: PendingRow = {
        id: pending.id,
        organizationId: org.id,
        planId: "plan_pro",
        status: "PENDING",
        xenditSessionId: pending.xenditSessionId,
        createdAt: new Date(),
    }

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
        async (args: { where?: { status?: string | { in?: string[] } } }) => {
            const status = args.where?.status
            if (status === "ACTIVE" || (typeof status === "object" && status?.in?.includes("ACTIVE"))) {
                return activePro
                    ? { ...activePro, organizationId: org.id, planId: "plan_pro" }
                    : null
            }
            if (status === "PENDING") {
                return { ...pendingRow }
            }
            return { ...pendingRow }
        },
    )
    prisma.subscription.create.mockImplementation(async () => {
        pendingRow.xenditSessionId = null
        return { ...pendingRow }
    })
    prisma.subscription.findUnique.mockImplementation(async () => ({
        xenditSessionId: pendingRow.xenditSessionId,
    }))
    prisma.subscription.findUniqueOrThrow.mockImplementation(async () => ({
        id: pendingRow.id,
        xenditSessionId: pendingRow.xenditSessionId,
    }))
    prisma.subscription.update.mockImplementation(
        async ({ data }: { data: { xenditSessionId?: string | null } }) => {
            if ("xenditSessionId" in data) {
                pendingRow.xenditSessionId = data.xenditSessionId ?? null
            }
            return { ...pendingRow }
        },
    )
    prisma.subscription.updateMany.mockResolvedValue({ count: 0 })

    // Serialize $transaction callbacks like a row lock (one interactive txn at a time).
    let txnChain: Promise<unknown> = Promise.resolve()
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) => {
        const run = txnChain.then(() => fn(prisma))
        txnChain = run.then(
            () => undefined,
            () => undefined,
        )
        return run
    })
    prisma.$queryRaw.mockResolvedValue([{ id: org.id }])

    return pendingRow
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
        expect(body.session_type).toBe("SUBSCRIPTION")
        expect(body.subscription).toMatchObject({
            schedule: {
                interval: "MONTH",
                interval_count: 1,
            },
            failed_cycle_action: "RESUME",
        })
        const schedule = (body.subscription as { schedule: { anchor_date: string } }).schedule
        expect(Date.parse(schedule.anchor_date)).toBeGreaterThanOrEqual(
            Date.parse(body.expires_at as string),
        )
        expect(body).not.toHaveProperty("allow_save_payment_method")
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
        const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString()
        getXenditSession.mockResolvedValue({
            payment_session_id: "ps_active",
            components_sdk_key: "sdk_active",
            status: "ACTIVE",
            customer_id: "cust-existing",
            expires_at: expiresAt,
            subscription: {
                schedule: {
                    anchor_date: new Date(Date.now() + 30 * 86_400_000).toISOString(),
                },
            },
        })

        const result = await BillingService.createProCheckoutSession(checkoutInput)

        expect(result).toEqual({
            componentsSdkKey: "sdk_active",
            sessionId: "ps_active",
            expiresAt,
        })
        expect(createXenditSession).not.toHaveBeenCalled()
    })

    it("creates a new session when the existing one has an invalid anchor_date", async () => {
        const org: OrgRow = {
            id: "org_abc",
            xenditCustomerReference: "org_org_abc",
            xenditCustomerId: "cust-existing",
        }
        setupPrisma(org, { id: "sub_1", xenditSessionId: "ps_bad_anchor" })
        getXenditSession.mockResolvedValue({
            payment_session_id: "ps_bad_anchor",
            components_sdk_key: "sdk_bad",
            status: "ACTIVE",
            customer_id: "cust-existing",
            expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
            subscription: {
                schedule: {
                    anchor_date: new Date().toISOString(),
                },
            },
        })

        await BillingService.createProCheckoutSession(checkoutInput)

        expect(createXenditSession).toHaveBeenCalledOnce()
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

    it("overlapping checkouts create only one Xendit session", async () => {
        const org: OrgRow = {
            id: "org_abc",
            xenditCustomerReference: "org_org_abc",
            xenditCustomerId: "cust-existing",
        }
        const pendingRow = setupPrisma(org, { id: "sub_1", xenditSessionId: null })

        let releaseCreate!: () => void
        const createGate = new Promise<void>((resolve) => {
            releaseCreate = resolve
        })
        let secondStarted = false
        let resolveSecondStarted!: () => void
        const secondStartedGate = new Promise<void>((resolve) => {
            resolveSecondStarted = resolve
        })

        const futureExpires = new Date(Date.now() + 20 * 60 * 1000).toISOString()
        const futureAnchor = new Date(Date.now() + 30 * 86_400_000).toISOString()
        getXenditSession.mockImplementation(async (sessionId: string) => {
            if (sessionId !== "ps_winner") return null
            return {
                payment_session_id: "ps_winner",
                components_sdk_key: "sdk_winner",
                expires_at: futureExpires,
                status: "ACTIVE",
                customer_id: "cust-existing",
                subscription: {
                    schedule: {
                        anchor_date: futureAnchor,
                    },
                },
            }
        })
        createXenditSession.mockImplementation(async () => {
            secondStarted = true
            resolveSecondStarted()
            await createGate
            return {
                payment_session_id: "ps_winner",
                components_sdk_key: "sdk_winner",
                expires_at: futureExpires,
                status: "ACTIVE",
                customer_id: "cust-existing",
            }
        })

        const first = BillingService.createProCheckoutSession(checkoutInput)
        await secondStartedGate
        expect(secondStarted).toBe(true)
        expect(pendingRow.xenditSessionId).toMatch(/^claim:/)

        const second = BillingService.createProCheckoutSession(checkoutInput)
        // Let the waiter poll while the first still holds the claim.
        await new Promise((r) => setTimeout(r, 50))
        releaseCreate()

        const [a, b] = await Promise.all([first, second])
        expect(a.sessionId).toBe("ps_winner")
        expect(b.sessionId).toBe("ps_winner")
        expect(createXenditSession).toHaveBeenCalledOnce()
        expect(pendingRow.xenditSessionId).toBe("ps_winner")
    })
})

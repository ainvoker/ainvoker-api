import { describe, expect, it } from "vitest"
import { pickAdminDisplaySubscription } from "../../src/modules/customers/service.js"

const row = (
    overrides: Partial<{
        id: string
        organizationId: string
        status: string
        expiresAt: Date | null
        planName: string
        startedAt: Date
    }> = {},
) => ({
    id: overrides.id ?? "sub_1",
    organizationId: overrides.organizationId ?? "org_1",
    status: overrides.status ?? "ACTIVE",
    expiresAt: overrides.expiresAt ?? null,
    cancelAtPeriodEnd: false,
    startedAt: overrides.startedAt ?? new Date("2026-01-01"),
    plan: { name: overrides.planName ?? "free" },
})

describe("pickAdminDisplaySubscription", () => {
    it("prefers active Pro over pending Scale checkout", () => {
        const future = new Date(Date.now() + 86400000)
        const picked = pickAdminDisplaySubscription([
            row({
                id: "sub_scale",
                status: "PENDING",
                planName: "scale",
                startedAt: new Date("2026-06-01"),
            }),
            row({
                id: "sub_pro",
                status: "ACTIVE",
                planName: "pro",
                expiresAt: future,
                startedAt: new Date("2026-01-01"),
            }),
        ])
        expect(picked?.id).toBe("sub_pro")
    })

    it("prefers active Free over pending Pro on personal checkout", () => {
        const picked = pickAdminDisplaySubscription([
            row({
                id: "sub_pro",
                status: "PENDING",
                planName: "pro",
                startedAt: new Date("2026-06-01"),
            }),
            row({
                id: "sub_free",
                status: "ACTIVE",
                planName: "free",
                startedAt: new Date("2025-01-01"),
            }),
        ])
        expect(picked?.id).toBe("sub_free")
    })

    it("shows pending Pro when no entitled active plan exists", () => {
        const picked = pickAdminDisplaySubscription([
            row({
                id: "sub_pro",
                status: "PENDING",
                planName: "pro",
                startedAt: new Date("2026-06-01"),
            }),
        ])
        expect(picked?.plan.name).toBe("pro")
        expect(picked?.status).toBe("PENDING")
    })
})

import type { Prisma } from "../../generated/prisma/client.js"
import env from "../../config/env.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import { AUDIT_ACTIONS } from "../audit/actions.js"
import { recordAuditEvent } from "../audit/record.js"
import { isEntitlementUnexpired } from "../billing/period.js"
import { isPersonalOrganizationSlug } from "../organizations/service.js"
import type {
    ListAdminOrganizationsQuery,
    ListAdminUsersQuery,
    UpdateAdminOrganizationInput,
} from "./schemas.js"

type UserSummary = {
    id: string
    email: string | null
    firstName: string | null
    lastName: string | null
}

type SubscriptionSnapshot = {
    id: string
    status: string
    planName: string
    expiresAt: string | null
    cancelAtPeriodEnd: boolean
} | null

function serializeUserSummary(user: {
    id: string
    email: string | null
    firstName: string | null
    lastName: string | null
}): UserSummary {
    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
    }
}

function serializeSubscription(
    sub: {
        id: string
        status: string
        expiresAt: Date | null
        cancelAtPeriodEnd: boolean
        plan: { name: string }
    } | null,
): SubscriptionSnapshot {
    if (!sub) return null
    return {
        id: sub.id,
        status: sub.status,
        planName: sub.plan.name,
        expiresAt: sub.expiresAt?.toISOString() ?? null,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    }
}

async function getOwnerRoleId() {
    const role = await prismaClient.role.findUnique({ where: { name: "owner" } })
    if (!role) {
        throw new AppError(500, "INTERNAL_ERROR", "Owner role is not seeded")
    }
    return role.id
}

async function loadOwnersByOrgIds(orgIds: string[], ownerRoleId: number) {
    if (orgIds.length === 0) return new Map<string, UserSummary>()

    const owners = await prismaClient.organizationMember.findMany({
        where: { organizationId: { in: orgIds }, roleId: ownerRoleId },
        include: {
            user: {
                select: { id: true, email: true, firstName: true, lastName: true },
            },
        },
    })

    const map = new Map<string, UserSummary>()
    for (const row of owners) {
        if (!map.has(row.organizationId)) {
            map.set(row.organizationId, serializeUserSummary(row.user))
        }
    }
    return map
}

async function loadMemberCounts(orgIds: string[]) {
    if (orgIds.length === 0) return new Map<string, number>()

    const counts = await prismaClient.organizationMember.groupBy({
        by: ["organizationId"],
        where: { organizationId: { in: orgIds } },
        _count: { _all: true },
    })

    return new Map(counts.map((c) => [c.organizationId, c._count._all]))
}

type SubscriptionRow = {
    id: string
    organizationId: string
    status: string
    expiresAt: Date | null
    cancelAtPeriodEnd: boolean
    startedAt: Date
    plan: { name: string }
}

/** Match billing UI: entitled plan wins over an in-flight Pro/Scale checkout row. */
export function pickAdminDisplaySubscription(
    subscriptions: SubscriptionRow[],
): SubscriptionRow | undefined {
    if (subscriptions.length === 0) return undefined

    const unexpiredActive = subscriptions.find(
        (s) =>
            (s.status === "ACTIVE" || s.status === "PAST_DUE") &&
            isEntitlementUnexpired(s.expiresAt),
    )
    if (unexpiredActive) return unexpiredActive

    const pending = subscriptions.find((s) => s.status === "PENDING")
    if (pending) return pending

    return subscriptions[0]
}

async function loadSubscriptionsByOrgIds(orgIds: string[]) {
    if (orgIds.length === 0) return new Map<string, SubscriptionSnapshot>()

    const subscriptions = await prismaClient.subscription.findMany({
        where: {
            organizationId: { in: orgIds },
            status: { in: ["ACTIVE", "PAST_DUE", "PENDING"] },
        },
        include: { plan: { select: { name: true } } },
        orderBy: { startedAt: "desc" },
    })

    const byOrg = new Map<string, SubscriptionRow[]>()
    for (const sub of subscriptions) {
        const list = byOrg.get(sub.organizationId) ?? []
        list.push(sub)
        byOrg.set(sub.organizationId, list)
    }

    const map = new Map<string, SubscriptionSnapshot>()
    for (const [orgId, subs] of byOrg) {
        const picked = pickAdminDisplaySubscription(subs)
        if (picked) {
            map.set(orgId, serializeSubscription(picked))
        }
    }
    return map
}

class AdminCustomersService {
    private organizationListWhere(
        query: ListAdminOrganizationsQuery,
    ): Prisma.OrganizationWhereInput {
        const where: Prisma.OrganizationWhereInput = {}

        if (query.status) {
            where.status = query.status
        } else {
            where.status = { not: "DELETED" }
        }

        const q = query.q?.trim()
        if (q) {
            where.OR = [
                { id: q },
                { name: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
                {
                    members: {
                        some: {
                            role: { name: "owner" },
                            user: { email: { contains: q, mode: "insensitive" } },
                        },
                    },
                },
            ]
        }

        return where
    }

    async listOrganizations(query: ListAdminOrganizationsQuery) {
        const where = this.organizationListWhere(query)
        const ownerRoleId = await getOwnerRoleId()

        const [total, orgs] = await Promise.all([
            prismaClient.organization.count({ where }),
            prismaClient.organization.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: query.limit,
                skip: query.offset,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
        ])

        const orgIds = orgs.map((o) => o.id)
        const [owners, memberCounts, subscriptions] = await Promise.all([
            loadOwnersByOrgIds(orgIds, ownerRoleId),
            loadMemberCounts(orgIds),
            loadSubscriptionsByOrgIds(orgIds),
        ])

        return {
            items: orgs.map((org) => {
                const subscription = subscriptions.get(org.id) ?? null
                return {
                    id: org.id,
                    name: org.name,
                    slug: org.slug,
                    status: org.status,
                    isPersonal: isPersonalOrganizationSlug(org.slug),
                    owner: owners.get(org.id) ?? null,
                    memberCount: memberCounts.get(org.id) ?? 0,
                    planName: subscription?.planName ?? null,
                    subscriptionStatus: subscription?.status ?? null,
                    createdAt: org.createdAt.toISOString(),
                    updatedAt: org.updatedAt.toISOString(),
                }
            }),
            total,
            limit: query.limit,
            offset: query.offset,
        }
    }

    async getOrganization(orgId: string) {
        const org = await prismaClient.organization.findUnique({
            where: { id: orgId },
            include: {
                projects: {
                    orderBy: { createdAt: "asc" },
                    select: {
                        id: true,
                        name: true,
                        environment: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true,
                        apiKeys: {
                            orderBy: { createdAt: "desc" },
                            select: {
                                id: true,
                                keyName: true,
                                keyPrefix: true,
                                status: true,
                                clientType: true,
                                lastUsed: true,
                                createdAt: true,
                            },
                        },
                    },
                },
                invites: {
                    where: { status: "PENDING" },
                    orderBy: { createdAt: "desc" },
                    include: { role: { select: { name: true } } },
                },
                _count: { select: { members: true } },
            },
        })

        if (!org) {
            throw new AppError(404, "NOT_FOUND", "Organization not found")
        }

        const ownerRoleId = await getOwnerRoleId()
        const [owners, subscriptions] = await Promise.all([
            loadOwnersByOrgIds([org.id], ownerRoleId),
            loadSubscriptionsByOrgIds([org.id]),
        ])

        const apiKeys = org.projects.flatMap((project) =>
            project.apiKeys.map((key) => ({
                id: key.id,
                projectId: project.id,
                projectName: project.name,
                keyName: key.keyName,
                keyPrefix: key.keyPrefix,
                status: key.status,
                clientType: key.clientType,
                lastUsed: key.lastUsed?.toISOString() ?? null,
                createdAt: key.createdAt.toISOString(),
            })),
        )

        return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            status: org.status,
            isPersonal: isPersonalOrganizationSlug(org.slug),
            owner: owners.get(org.id) ?? null,
            memberCount: org._count.members,
            subscription: subscriptions.get(org.id) ?? null,
            projects: org.projects.map((project) => ({
                id: project.id,
                name: project.name,
                environment: project.environment,
                status: project.status,
                apiKeyCount: project.apiKeys.length,
                createdAt: project.createdAt.toISOString(),
                updatedAt: project.updatedAt.toISOString(),
            })),
            apiKeys,
            invites: org.invites.map((invite) => ({
                id: invite.id,
                email: invite.email,
                role: invite.role.name,
                status: invite.status,
                expiresAt: invite.expiresAt.toISOString(),
                createdAt: invite.createdAt.toISOString(),
            })),
            createdAt: org.createdAt.toISOString(),
            updatedAt: org.updatedAt.toISOString(),
        }
    }

    async updateOrganization(
        orgId: string,
        input: UpdateAdminOrganizationInput,
        actorUserId: string,
    ) {
        const existing = await prismaClient.organization.findUnique({
            where: { id: orgId },
            select: { id: true, name: true, status: true },
        })

        if (!existing) {
            throw new AppError(404, "NOT_FOUND", "Organization not found")
        }

        if (existing.status === "DELETED") {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                "Deleted organizations cannot be suspended or reinstated",
            )
        }

        await prismaClient.organization.update({
            where: { id: orgId },
            data: { status: input.status },
        })

        const suspended = input.status === "SUSPENDED"
        await recordAuditEvent({
            actorUserId,
            actorType: "PLATFORM_ADMIN",
            action: suspended
                ? AUDIT_ACTIONS.organizationSuspended
                : AUDIT_ACTIONS.organizationReinstated,
            targetType: "organization",
            targetId: orgId,
            organizationId: orgId,
            summary: suspended
                ? `Workspace "${existing.name}" suspended`
                : `Workspace "${existing.name}" reinstated`,
            metadata: { before: existing.status, after: input.status },
        })

        return this.getOrganization(orgId)
    }

    private userListWhere(query: ListAdminUsersQuery): Prisma.UserWhereInput {
        const q = query.q?.trim()
        if (!q) return {}

        return {
            OR: [
                { id: q },
                { email: { contains: q, mode: "insensitive" } },
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
            ],
        }
    }

    async listUsers(query: ListAdminUsersQuery) {
        const where = this.userListWhere(query)

        const [total, users] = await Promise.all([
            prismaClient.user.count({ where }),
            prismaClient.user.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: query.limit,
                skip: query.offset,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    profilePicture: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: { select: { memberships: true } },
                },
            }),
        ])

        return {
            items: users.map((user) => ({
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                profilePicture: user.profilePicture,
                isPlatformAdmin: env.isPlatformAdmin(user.id),
                membershipCount: user._count.memberships,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
            })),
            total,
            limit: query.limit,
            offset: query.offset,
        }
    }

    async getUser(userId: string) {
        const user = await prismaClient.user.findUnique({
            where: { id: userId },
            include: {
                memberships: {
                    include: {
                        role: { select: { name: true } },
                        organization: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                status: true,
                                createdAt: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "asc" },
                },
            },
        })

        if (!user) {
            throw new AppError(404, "NOT_FOUND", "User not found")
        }

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePicture: user.profilePicture,
            themePreference: user.themePreference,
            freeQuotaUnitsUsed: user.freeQuotaUnitsUsed,
            freeQuotaUnitsLimit: user.freeQuotaUnitsLimit,
            isPlatformAdmin: env.isPlatformAdmin(user.id),
            memberships: user.memberships.map((m) => ({
                id: m.id,
                role: m.role.name,
                organization: {
                    id: m.organization.id,
                    name: m.organization.name,
                    slug: m.organization.slug,
                    status: m.organization.status,
                    isPersonal: isPersonalOrganizationSlug(m.organization.slug),
                    createdAt: m.organization.createdAt.toISOString(),
                },
                createdAt: m.createdAt.toISOString(),
            })),
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        }
    }
}

export default new AdminCustomersService()

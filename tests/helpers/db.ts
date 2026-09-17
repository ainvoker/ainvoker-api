import { randomUUID } from "node:crypto"
import prismaClient from "../../src/platform/prisma.js"
import organizationsService from "../../src/modules/organizations/service.js"

export const TEST_USER_ID_PREFIX = "vitest-"

export function testUserId(suffix?: string): string {
    return `${TEST_USER_ID_PREFIX}${suffix ?? randomUUID()}`
}

export type SeededAuthUser = Awaited<ReturnType<typeof seedUserWithPersonalOrg>>

/** Create app User + default Personal org (mirrors signup bootstrap). */
export async function seedUserWithPersonalOrg(
    userId = testUserId(),
    profile?: {
        email?: string | null
        firstName?: string | null
        lastName?: string | null
        profilePicture?: string | null
    },
) {
    await organizationsService.ensureUserAndPersonalOrg(userId, profile)

    const membership = await prismaClient.organizationMember.findFirstOrThrow({
        where: { userId },
        include: { organization: true, role: true },
        orderBy: { createdAt: "asc" },
    })

    return {
        userId,
        organizationId: membership.organizationId,
        organization: membership.organization,
        role: membership.role,
    }
}

/**
 * Delete a test user and all orgs they belong to.
 * Safe to call when the user was never created always best-effort.
 */
export async function cleanupTestUser(userId: string) {
    if (!userId) return

    try {
        const memberships = await prismaClient.organizationMember.findMany({
            where: { userId },
            select: { organizationId: true },
        })
        const orgIds = [...new Set(memberships.map((m) => m.organizationId))]

        if (orgIds.length > 0) {
            const projects = await prismaClient.project.findMany({
                where: { organizationId: { in: orgIds } },
                select: { id: true },
            })
            const projectIds = projects.map((p) => p.id)

            if (projectIds.length > 0) {
                await prismaClient.actionInvocation.deleteMany({
                    where: { request: { projectId: { in: projectIds } } },
                })
                await prismaClient.aIRequest.deleteMany({
                    where: { projectId: { in: projectIds } },
                })
                await prismaClient.action.deleteMany({ where: { projectId: { in: projectIds } } })
                await prismaClient.usageAnalytics.deleteMany({
                    where: { projectId: { in: projectIds } },
                })
                await prismaClient.webhook.deleteMany({ where: { projectId: { in: projectIds } } })
                await prismaClient.apiKey.deleteMany({ where: { projectId: { in: projectIds } } })
                await prismaClient.project.deleteMany({ where: { id: { in: projectIds } } })
            }

            const subscriptions = await prismaClient.subscription.findMany({
                where: { organizationId: { in: orgIds } },
                select: { id: true },
            })
            const subscriptionIds = subscriptions.map((s) => s.id)
            if (subscriptionIds.length > 0) {
                await prismaClient.transaction.deleteMany({
                    where: { subscriptionId: { in: subscriptionIds } },
                })
                await prismaClient.subscription.deleteMany({
                    where: { id: { in: subscriptionIds } },
                })
            }

            await prismaClient.organizationInvite.deleteMany({
                where: { organizationId: { in: orgIds } },
            })
            await prismaClient.organizationMember.deleteMany({
                where: { organizationId: { in: orgIds } },
            })
            await prismaClient.organization.deleteMany({ where: { id: { in: orgIds } } })
        }

        await prismaClient.activityLog.deleteMany({ where: { userId } })
        await prismaClient.user.deleteMany({ where: { id: userId } })
    } catch (err) {
        console.error(`[cleanupTestUser] failed for ${userId}:`, err)
    }
}

/** Sweep leftover vitest-* users (e.g. after a crashed run). */
export async function cleanupAllTestUsers() {
    const users = await prismaClient.user.findMany({
        where: { id: { startsWith: TEST_USER_ID_PREFIX } },
        select: { id: true },
    })

    for (const user of users) {
        await cleanupTestUser(user.id)
    }
}

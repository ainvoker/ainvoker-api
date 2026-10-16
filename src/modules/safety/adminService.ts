import { Prisma } from "../../generated/prisma/client.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import { AUDIT_ACTIONS } from "../audit/actions.js"
import { recordAuditEvent } from "../audit/record.js"
import type {
    ListAdminApiKeysQuery,
    ListAdminProjectsQuery,
    UpdateAdminProjectInput,
} from "./adminSchemas.js"

class AdminSafetyService {
    private apiKeyListWhere(query: ListAdminApiKeysQuery): Prisma.ApiKeyWhereInput {
        const where: Prisma.ApiKeyWhereInput = {}
        if (query.status) where.status = query.status

        const q = query.q?.trim()
        if (q) {
            where.OR = [
                { id: q },
                { keyName: { contains: q, mode: "insensitive" } },
                { keyPrefix: { contains: q, mode: "insensitive" } },
                { project: { name: { contains: q, mode: "insensitive" } } },
                { project: { organization: { name: { contains: q, mode: "insensitive" } } } },
                { project: { organization: { slug: { contains: q, mode: "insensitive" } } } },
                { project: { organizationId: q } },
            ]
        }

        return where
    }

    private projectListWhere(query: ListAdminProjectsQuery): Prisma.ProjectWhereInput {
        const where: Prisma.ProjectWhereInput = {}
        if (query.status) where.status = query.status

        const q = query.q?.trim()
        if (q) {
            where.OR = [
                { id: q },
                { name: { contains: q, mode: "insensitive" } },
                { organizationId: q },
                { organization: { name: { contains: q, mode: "insensitive" } } },
                { organization: { slug: { contains: q, mode: "insensitive" } } },
            ]
        }

        return where
    }

    private serializeApiKey(key: {
        id: string
        keyName: string
        keyPrefix: string
        status: string
        clientType: string
        lastUsed: Date | null
        createdAt: Date
        project: {
            id: string
            name: string
            organization: { id: string; name: string; slug: string }
        }
    }) {
        return {
            id: key.id,
            keyName: key.keyName,
            keyPrefix: key.keyPrefix,
            status: key.status,
            clientType: key.clientType,
            lastUsed: key.lastUsed?.toISOString() ?? null,
            createdAt: key.createdAt.toISOString(),
            projectId: key.project.id,
            projectName: key.project.name,
            organizationId: key.project.organization.id,
            organizationName: key.project.organization.name,
            organizationSlug: key.project.organization.slug,
        }
    }

    private serializeProject(project: {
        id: string
        name: string
        environment: string
        status: string
        createdAt: Date
        updatedAt: Date
        organization: { id: string; name: string; slug: string }
        _count: { apiKeys: number }
    }) {
        return {
            id: project.id,
            name: project.name,
            environment: project.environment,
            status: project.status,
            apiKeyCount: project._count.apiKeys,
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString(),
            organizationId: project.organization.id,
            organizationName: project.organization.name,
            organizationSlug: project.organization.slug,
        }
    }

    async listApiKeys(query: ListAdminApiKeysQuery) {
        const where = this.apiKeyListWhere(query)

        const [total, keys] = await Promise.all([
            prismaClient.apiKey.count({ where }),
            prismaClient.apiKey.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: query.limit,
                skip: query.offset,
                include: {
                    project: {
                        select: {
                            id: true,
                            name: true,
                            organization: {
                                select: { id: true, name: true, slug: true },
                            },
                        },
                    },
                },
            }),
        ])

        return {
            items: keys.map((key) => this.serializeApiKey(key)),
            total,
            limit: query.limit,
            offset: query.offset,
        }
    }

    async revokeApiKey(keyId: string, actorUserId: string) {
        const existing = await prismaClient.apiKey.findUnique({
            where: { id: keyId },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        organization: {
                            select: { id: true, name: true, slug: true },
                        },
                    },
                },
            },
        })

        if (!existing) {
            throw new AppError(404, "NOT_FOUND", "API key not found")
        }

        const key =
            existing.status === "REVOKED"
                ? existing
                : await prismaClient.apiKey.update({
                      where: { id: keyId },
                      data: { status: "REVOKED" },
                      include: {
                          project: {
                              select: {
                                  id: true,
                                  name: true,
                                  organization: {
                                      select: { id: true, name: true, slug: true },
                                  },
                              },
                          },
                      },
                  })

        if (existing.status !== "REVOKED") {
            await recordAuditEvent({
                actorUserId,
                actorType: "PLATFORM_ADMIN",
                action: AUDIT_ACTIONS.apiKeyRevoked,
                targetType: "api_key",
                targetId: key.id,
                organizationId: key.project.organization.id,
                summary: `API key "${key.keyName}" (${key.keyPrefix}…) revoked`,
                metadata: {
                    before: existing.status,
                    after: "REVOKED",
                    projectId: key.project.id,
                    projectName: key.project.name,
                },
            })
        }

        return this.serializeApiKey(key)
    }

    async listProjects(query: ListAdminProjectsQuery) {
        const where = this.projectListWhere(query)

        const [total, projects] = await Promise.all([
            prismaClient.project.count({ where }),
            prismaClient.project.findMany({
                where,
                orderBy: { updatedAt: "desc" },
                take: query.limit,
                skip: query.offset,
                include: {
                    organization: {
                        select: { id: true, name: true, slug: true },
                    },
                    _count: { select: { apiKeys: true } },
                },
            }),
        ])

        return {
            items: projects.map((project) => this.serializeProject(project)),
            total,
            limit: query.limit,
            offset: query.offset,
        }
    }

    async updateProject(
        projectId: string,
        input: UpdateAdminProjectInput,
        actorUserId: string,
    ) {
        const existing = await prismaClient.project.findUnique({
            where: { id: projectId },
            include: {
                organization: {
                    select: { id: true, name: true, slug: true },
                },
                _count: { select: { apiKeys: true } },
            },
        })

        if (!existing) {
            throw new AppError(404, "NOT_FOUND", "Project not found")
        }

        if (existing.status === input.status) {
            return this.serializeProject(existing)
        }

        const project = await prismaClient.project.update({
            where: { id: projectId },
            data: { status: input.status },
            include: {
                organization: {
                    select: { id: true, name: true, slug: true },
                },
                _count: { select: { apiKeys: true } },
            },
        })

        const disabled = input.status === "DISABLED"
        await recordAuditEvent({
            actorUserId,
            actorType: "PLATFORM_ADMIN",
            action: disabled ? AUDIT_ACTIONS.projectDisabled : AUDIT_ACTIONS.projectReenabled,
            targetType: "project",
            targetId: project.id,
            organizationId: project.organization.id,
            summary: disabled
                ? `Project "${project.name}" disabled`
                : `Project "${project.name}" re-enabled`,
            metadata: { before: existing.status, after: input.status },
        })

        return this.serializeProject(project)
    }
}

export default new AdminSafetyService()

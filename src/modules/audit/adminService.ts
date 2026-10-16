import type { Prisma } from "../../generated/prisma/client.js"
import prismaClient from "../../platform/prisma.js"
import type { ListAdminAuditEventsQuery } from "./adminSchemas.js"

class AdminAuditService {
    private listWhere(query: ListAdminAuditEventsQuery): Prisma.AuditEventWhereInput {
        const clauses: Prisma.AuditEventWhereInput[] = []

        if (query.action) {
            clauses.push({ action: query.action })
        }
        if (query.actorType) {
            clauses.push({ actorType: query.actorType })
        }
        if (query.organizationId) {
            clauses.push({ organizationId: query.organizationId })
        }

        const q = query.q?.trim()
        if (q) {
            clauses.push({
                OR: [
                    { summary: { contains: q, mode: "insensitive" } },
                    { targetId: { contains: q, mode: "insensitive" } },
                    { organizationId: { contains: q, mode: "insensitive" } },
                    { actorUserId: q },
                    { actor: { email: { contains: q, mode: "insensitive" } } },
                    {
                        actor: {
                            firstName: { contains: q, mode: "insensitive" },
                        },
                    },
                    {
                        actor: {
                            lastName: { contains: q, mode: "insensitive" },
                        },
                    },
                ],
            })
        }

        if (clauses.length === 0) return {}
        if (clauses.length === 1) return clauses[0]!
        return { AND: clauses }
    }

    async listEvents(query: ListAdminAuditEventsQuery) {
        const where = this.listWhere(query)

        const [rows, total] = await Promise.all([
            prismaClient.auditEvent.findMany({
                where,
                include: {
                    actor: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: query.limit,
                skip: query.offset,
            }),
            prismaClient.auditEvent.count({ where }),
        ])

        return {
            items: rows.map((row) => ({
                id: row.id,
                actorUserId: row.actorUserId,
                actorType: row.actorType,
                actor: row.actor
                    ? {
                          id: row.actor.id,
                          email: row.actor.email,
                          firstName: row.actor.firstName,
                          lastName: row.actor.lastName,
                      }
                    : null,
                action: row.action,
                targetType: row.targetType,
                targetId: row.targetId,
                organizationId: row.organizationId,
                summary: row.summary,
                metadata: row.metadata,
                createdAt: row.createdAt.toISOString(),
            })),
            total,
            limit: query.limit,
            offset: query.offset,
        }
    }
}

export default new AdminAuditService()

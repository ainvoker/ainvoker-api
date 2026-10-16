import type { AuditActorType, Prisma } from "../../generated/prisma/client.js"
import prismaClient from "../../platform/prisma.js"
import type { AuditAction } from "./actions.js"

export type RecordAuditEventInput = {
    actorUserId?: string | null
    actorType: AuditActorType
    action: AuditAction | string
    targetType: string
    targetId?: string | null
    organizationId?: string | null
    summary: string
    metadata?: Prisma.InputJsonValue
}

/** Persist an audit row. Never throws — product mutations must not fail if audit write fails. */
export async function recordAuditEvent(input: RecordAuditEventInput): Promise<void> {
    try {
        await prismaClient.auditEvent.create({
            data: {
                actorUserId: input.actorUserId ?? null,
                actorType: input.actorType,
                action: input.action,
                targetType: input.targetType,
                targetId: input.targetId ?? null,
                organizationId: input.organizationId ?? null,
                summary: input.summary,
                ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
            },
        })
    } catch (err) {
        console.error("[audit] failed to record event", {
            action: input.action,
            targetType: input.targetType,
            targetId: input.targetId,
            err,
        })
    }
}

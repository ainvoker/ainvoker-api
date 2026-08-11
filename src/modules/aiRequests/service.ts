import type { Prisma } from "../../generated/prisma/client.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import projectsService from "../projects/service.js"
import type { z } from "zod"
import type { listAiRequestsQuerySchema } from "./schemas.js"

type AiRequestRow = {
    id: string
    projectId: string
    apiKeyId: string
    modelId: number
    serviceType: string
    requestPayload: Prisma.JsonValue
    responsePayload: Prisma.JsonValue | null
    inputTokens: number | null
    outputTokens: number | null
    totalTokens: number | null
    latency: number | null
    requestCost: Prisma.Decimal | null
    requestStatus: string
    createdAt: Date
    model: {
        name: string
        provider: { name: string }
    }
    apiKey: {
        keyName: string
        keyPrefix: string
    }
}

class AiRequestsService {
    private serializeSummary(row: AiRequestRow) {
        return {
            id: row.id,
            projectId: row.projectId,
            apiKeyId: row.apiKeyId,
            apiKeyName: row.apiKey.keyName,
            apiKeyPrefix: row.apiKey.keyPrefix,
            model: `${row.model.provider.name}/${row.model.name}`,
            serviceType: row.serviceType,
            requestStatus: row.requestStatus,
            inputTokens: row.inputTokens,
            outputTokens: row.outputTokens,
            totalTokens: row.totalTokens,
            latency: row.latency,
            requestCost: row.requestCost?.toString() ?? null,
            createdAt: row.createdAt.toISOString(),
        }
    }

    private serializeDetail(row: AiRequestRow) {
        return {
            ...this.serializeSummary(row),
            requestPayload: row.requestPayload,
            responsePayload: row.responsePayload,
        }
    }

    private readonly include = {
        model: {
            select: {
                name: true,
                provider: { select: { name: true } },
            },
        },
        apiKey: {
            select: {
                keyName: true,
                keyPrefix: true,
            },
        },
    } as const

    async listAiRequests(
        projectId: string,
        userId: string,
        query: z.infer<typeof listAiRequestsQuerySchema>,
    ) {
        await projectsService.getProjectForMember(projectId, userId)

        const where = {
            projectId,
            ...(query.status ? { requestStatus: query.status } : {}),
        }

        const [rows, total] = await Promise.all([
            prismaClient.aIRequest.findMany({
                where,
                include: this.include,
                orderBy: { createdAt: "desc" },
                take: query.limit,
                skip: query.offset,
            }),
            prismaClient.aIRequest.count({ where }),
        ])

        return {
            items: rows.map((row) => this.serializeSummary(row)),
            total,
            limit: query.limit,
            offset: query.offset,
        }
    }

    async getAiRequest(projectId: string, requestId: string, userId: string) {
        await projectsService.getProjectForMember(projectId, userId)

        const row = await prismaClient.aIRequest.findFirst({
            where: { id: requestId, projectId },
            include: this.include,
        })

        if (!row) {
            throw new AppError(404, "NOT_FOUND", "AI request not found")
        }

        return this.serializeDetail(row)
    }
}

export default new AiRequestsService()

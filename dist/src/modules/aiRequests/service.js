import { AppError } from "../../platform/errors.js";
import prismaClient from "../../platform/prisma.js";
import projectsService from "../projects/service.js";
class AiRequestsService {
    serializeSummary(row) {
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
        };
    }
    serializeDetail(row) {
        return {
            ...this.serializeSummary(row),
            requestPayload: row.requestPayload,
            responsePayload: row.responsePayload,
        };
    }
    include = {
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
    };
    async listAiRequests(projectId, userId, query) {
        await projectsService.getProjectForMember(projectId, userId);
        const where = {
            projectId,
            ...(query.status ? { requestStatus: query.status } : {}),
        };
        const [rows, total] = await Promise.all([
            prismaClient.aIRequest.findMany({
                where,
                include: this.include,
                orderBy: { createdAt: "desc" },
                take: query.limit,
                skip: query.offset,
            }),
            prismaClient.aIRequest.count({ where }),
        ]);
        return {
            items: rows.map((row) => this.serializeSummary(row)),
            total,
            limit: query.limit,
            offset: query.offset,
        };
    }
    async getAiRequest(projectId, requestId, userId) {
        await projectsService.getProjectForMember(projectId, userId);
        const row = await prismaClient.aIRequest.findFirst({
            where: { id: requestId, projectId },
            include: this.include,
        });
        if (!row) {
            throw new AppError(404, "NOT_FOUND", "AI request not found");
        }
        return this.serializeDetail(row);
    }
}
export default new AiRequestsService();
//# sourceMappingURL=service.js.map
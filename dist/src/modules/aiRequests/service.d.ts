import type { z } from "zod";
import type { listAiRequestsQuerySchema } from "./schemas.js";
declare class AiRequestsService {
    private serializeSummary;
    private serializeDetail;
    private readonly include;
    listAiRequests(projectId: string, userId: string, query: z.infer<typeof listAiRequestsQuerySchema>): Promise<{
        items: {
            id: string;
            projectId: string;
            apiKeyId: string;
            apiKeyName: string;
            apiKeyPrefix: string;
            model: string;
            serviceType: string;
            requestStatus: string;
            inputTokens: number | null;
            outputTokens: number | null;
            totalTokens: number | null;
            latency: number | null;
            requestCost: string | null;
            createdAt: string;
        }[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getAiRequest(projectId: string, requestId: string, userId: string): Promise<{
        requestPayload: import("@prisma/client/runtime/client").JsonValue;
        responsePayload: import("@prisma/client/runtime/client").JsonValue;
        id: string;
        projectId: string;
        apiKeyId: string;
        apiKeyName: string;
        apiKeyPrefix: string;
        model: string;
        serviceType: string;
        requestStatus: string;
        inputTokens: number | null;
        outputTokens: number | null;
        totalTokens: number | null;
        latency: number | null;
        requestCost: string | null;
        createdAt: string;
    }>;
}
declare const _default: AiRequestsService;
export default _default;
//# sourceMappingURL=service.d.ts.map
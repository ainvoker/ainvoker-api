import type { z } from "zod";
import type { createApiKeySchema } from "./schemas.js";
declare class ApiKeyService {
    private serializeApiKey;
    listApiKeys(projectId: string, userId: string): Promise<{
        id: string;
        projectId: string;
        keyName: string;
        keyPrefix: string;
        permissions: import("@prisma/client/runtime/client").JsonValue;
        lastUsed: Date | null;
        expiresAt: Date | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    createApiKey(projectId: string, userId: string, input: z.infer<typeof createApiKeySchema>): Promise<{
        apiKey: string;
        id: string;
        projectId: string;
        keyName: string;
        keyPrefix: string;
        permissions: import("@prisma/client/runtime/client").JsonValue;
        lastUsed: Date | null;
        expiresAt: Date | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    revokeApiKey(projectId: string, keyId: string, userId: string): Promise<{
        id: string;
        projectId: string;
        keyName: string;
        keyPrefix: string;
        permissions: import("@prisma/client/runtime/client").JsonValue;
        lastUsed: Date | null;
        expiresAt: Date | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteApiKey(projectId: string, keyId: string, userId: string): Promise<void>;
}
declare const _default: ApiKeyService;
export default _default;
//# sourceMappingURL=service.d.ts.map
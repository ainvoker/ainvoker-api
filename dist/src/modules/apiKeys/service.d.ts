import type { z } from "zod";
import type { createApiKeySchema } from "./schemas.js";
export declare function listApiKeys(projectId: string, userId: string): Promise<{
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
export declare function createApiKey(projectId: string, userId: string, input: z.infer<typeof createApiKeySchema>): Promise<{
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
export declare function revokeApiKey(projectId: string, keyId: string, userId: string): Promise<{
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
export declare function deleteApiKey(projectId: string, keyId: string, userId: string): Promise<void>;
//# sourceMappingURL=service.d.ts.map
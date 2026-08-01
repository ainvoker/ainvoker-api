import { z } from "zod";
export const createApiKeySchema = z.object({
    keyName: z.string().trim().min(1).max(100),
    permissions: z.unknown().optional(),
    expiresAt: z.coerce.date().optional(),
});
export const apiKeyParamsSchema = z.object({
    projectId: z.string().min(1),
    keyId: z.string().min(1),
});
export const projectIdParamsSchema = z.object({
    projectId: z.string().min(1),
});
//# sourceMappingURL=schemas.js.map
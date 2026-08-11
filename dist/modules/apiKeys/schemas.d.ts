import { z } from "zod";
export declare const createApiKeySchema: z.ZodObject<{
    keyName: z.ZodString;
    permissions: z.ZodOptional<z.ZodUnknown>;
    expiresAt: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export declare const apiKeyParamsSchema: z.ZodObject<{
    projectId: z.ZodString;
    keyId: z.ZodString;
}, z.core.$strip>;
export declare const projectIdParamsSchema: z.ZodObject<{
    projectId: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map
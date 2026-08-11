import { z } from "zod";
export declare const projectIdParamsSchema: z.ZodObject<{
    projectId: z.ZodString;
}, z.core.$strip>;
export declare const aiRequestParamsSchema: z.ZodObject<{
    projectId: z.ZodString;
    requestId: z.ZodString;
}, z.core.$strip>;
export declare const listAiRequestsQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        PENDING: "PENDING";
        SUCCESS: "SUCCESS";
        FAILED: "FAILED";
        REJECTED: "REJECTED";
    }>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    offset: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map
import { z } from "zod";
export declare const orgIdParamsSchema: z.ZodObject<{
    orgId: z.ZodString;
}, z.core.$strip>;
export declare const createOrganizationSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    plan: z.ZodEnum<{
        pro: "pro";
        scale: "scale";
    }>;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map
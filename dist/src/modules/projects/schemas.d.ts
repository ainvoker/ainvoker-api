import { z } from "zod";
export declare const createProjectSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    environment: z.ZodEnum<{
        DEVELOPMENT: "DEVELOPMENT";
        STAGING: "STAGING";
        PRODUCTION: "PRODUCTION";
    }>;
}, z.core.$strip>;
export declare const updateProjectSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    environment: z.ZodOptional<z.ZodEnum<{
        DEVELOPMENT: "DEVELOPMENT";
        STAGING: "STAGING";
        PRODUCTION: "PRODUCTION";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        ARCHIVED: "ARCHIVED";
        DISABLED: "DISABLED";
    }>>;
}, z.core.$strip>;
export declare const projectIdParamsSchema: z.ZodObject<{
    projectId: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map
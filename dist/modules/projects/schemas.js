import { z } from "zod";
const projectEnvironmentSchema = z.enum(["DEVELOPMENT", "STAGING", "PRODUCTION"]);
const projectStatusSchema = z.enum(["ACTIVE", "ARCHIVED", "DISABLED"]);
export const createProjectSchema = z.object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(2000).optional(),
    environment: projectEnvironmentSchema,
});
export const updateProjectSchema = z
    .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    environment: projectEnvironmentSchema.optional(),
    status: projectStatusSchema.optional(),
})
    .refine((body) => Object.keys(body).length > 0, {
    message: "At least one field is required",
});
export const projectIdParamsSchema = z.object({
    projectId: z.string().min(1),
});
//# sourceMappingURL=schemas.js.map
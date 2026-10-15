import { z } from "zod"

const organizationStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "DELETED"])

export const listAdminOrganizationsQuerySchema = z.object({
    q: z.string().trim().min(1).optional(),
    status: organizationStatusSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
})

export const adminOrganizationParamsSchema = z.object({
    orgId: z.string().min(1),
})

export const updateAdminOrganizationSchema = z.object({
    status: z.enum(["ACTIVE", "SUSPENDED"]),
})

export const listAdminUsersQuerySchema = z.object({
    q: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
})

export const adminUserParamsSchema = z.object({
    userId: z.string().min(1),
})

export type ListAdminOrganizationsQuery = z.infer<typeof listAdminOrganizationsQuerySchema>
export type UpdateAdminOrganizationInput = z.infer<typeof updateAdminOrganizationSchema>
export type ListAdminUsersQuery = z.infer<typeof listAdminUsersQuerySchema>

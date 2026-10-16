import { z } from "zod"
import { AUDIT_ACTION_VALUES } from "./actions.js"

export const listAdminAuditEventsQuerySchema = z.object({
    q: z.string().trim().min(1).max(200).optional(),
    action: z.enum(AUDIT_ACTION_VALUES as [string, ...string[]]).optional(),
    actorType: z.enum(["USER", "PLATFORM_ADMIN"]).optional(),
    organizationId: z.string().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
})

export type ListAdminAuditEventsQuery = z.infer<typeof listAdminAuditEventsQuerySchema>

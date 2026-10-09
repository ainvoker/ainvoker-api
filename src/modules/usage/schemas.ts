import { z } from "zod"
import { ANALYTICS_RANGES } from "./aggregate.js"

export const projectAnalyticsQuerySchema = z.object({
    range: z.enum(ANALYTICS_RANGES).default("billing_month"),
})

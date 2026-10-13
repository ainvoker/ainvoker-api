import { z } from "zod"
import { ANALYTICS_RANGES } from "./aggregate.js"

const MAX_CUSTOM_RANGE_YEARS = 10

export const usageRangeQuerySchema = z
    .object({
        range: z.enum(ANALYTICS_RANGES).default("current_period"),
        month: z
            .string()
            .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Expected YYYY-MM")
            .optional()
            .describe("Required when range=calendar_month"),
        from: z.iso.date().optional().describe("Inclusive UTC day; required when range=custom"),
        to: z.iso.date().optional().describe("Inclusive UTC day; required when range=custom"),
    })
    .superRefine((query, ctx) => {
        if (query.range === "calendar_month" && !query.month) {
            ctx.addIssue({ code: "custom", path: ["month"], message: "month is required" })
        }
        if (query.range !== "custom") return
        if (!query.from || !query.to) {
            ctx.addIssue({ code: "custom", path: ["from"], message: "from and to are required" })
            return
        }
        if (query.from > query.to) {
            ctx.addIssue({ code: "custom", path: ["to"], message: "to must be on or after from" })
            return
        }
        const fromYear = Number(query.from.slice(0, 4))
        const toYear = Number(query.to.slice(0, 4))
        if (toYear - fromYear > MAX_CUSTOM_RANGE_YEARS) {
            ctx.addIssue({
                code: "custom",
                path: ["to"],
                message: `Custom ranges are limited to ${MAX_CUSTOM_RANGE_YEARS} years`,
            })
        }
    })

export type UsageRangeQuery = z.infer<typeof usageRangeQuerySchema>

export const projectAnalyticsQuerySchema = usageRangeQuerySchema

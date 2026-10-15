import { Router } from "express"
import type { Request, Response } from "express"
import { Prisma } from "../../generated/prisma/client.js"
import requirePlatformAdmin from "../../middleware/requirePlatformAdmin.js"
import requireSession from "../../middleware/requireSession.js"
import { BaseRoutes } from "../../platform/BaseRoutes.js"
import http from "../../platform/http.js"
import prismaClient from "../../platform/prisma.js"
import { AppError } from "../../platform/errors.js"
import { z } from "zod"
import { ensureBusinessSettings, recomputeAllModelRetailPrices } from "./retail.js"

const updateBusinessSettingsSchema = z.object({
    economyMarkupMultiplier: z.number().positive().max(10).optional(),
    premiumMarkupMultiplier: z.number().positive().max(10).optional(),
    imageMarkupMultiplier: z.number().positive().max(10).optional(),
    usdToPhpRate: z.number().positive().max(9999).optional(),
    quotaReferenceModelId: z.number().int().positive().nullable().optional(),
    scaleAdvanceCentavos: z.number().int().positive().optional(),
})

class AdminBusinessRoutes extends BaseRoutes {
    readonly router = Router()

    constructor() {
        super()
        this.router.use(requireSession, requirePlatformAdmin)
        this.router.get("/business-settings", this.bind(this.getSettings))
        this.router.put("/business-settings", this.bind(this.putSettings))
    }

    private async getSettings(_req: Request, res: Response) {
        const settings = await ensureBusinessSettings()
        http.ok(res, {
            economyMarkupMultiplier: settings.economyMarkupMultiplier.toString(),
            premiumMarkupMultiplier: settings.premiumMarkupMultiplier.toString(),
            imageMarkupMultiplier: settings.imageMarkupMultiplier.toString(),
            usdToPhpRate: settings.usdToPhpRate.toString(),
            quotaReferenceModelId: settings.quotaReferenceModelId,
            scaleAdvanceCentavos: settings.scaleAdvanceCentavos,
            updatedAt: settings.updatedAt.toISOString(),
        })
    }

    private async putSettings(req: Request, res: Response) {
        const body = updateBusinessSettingsSchema.parse(req.body)
        if (body.quotaReferenceModelId != null) {
            const exists = await prismaClient.aIModel.findUnique({
                where: { id: body.quotaReferenceModelId },
                select: { id: true },
            })
            if (!exists) {
                throw new AppError(400, "VALIDATION_ERROR", "quotaReferenceModelId not found")
            }
        }
        const settings = await prismaClient.platformBusinessSettings.upsert({
            where: { id: 1 },
            create: {
                id: 1,
                ...(body.economyMarkupMultiplier !== undefined
                    ? { economyMarkupMultiplier: new Prisma.Decimal(body.economyMarkupMultiplier) }
                    : {}),
                ...(body.premiumMarkupMultiplier !== undefined
                    ? { premiumMarkupMultiplier: new Prisma.Decimal(body.premiumMarkupMultiplier) }
                    : {}),
                ...(body.imageMarkupMultiplier !== undefined
                    ? { imageMarkupMultiplier: new Prisma.Decimal(body.imageMarkupMultiplier) }
                    : {}),
                ...(body.usdToPhpRate !== undefined
                    ? { usdToPhpRate: new Prisma.Decimal(body.usdToPhpRate) }
                    : {}),
                ...(body.quotaReferenceModelId !== undefined
                    ? { quotaReferenceModelId: body.quotaReferenceModelId }
                    : {}),
                ...(body.scaleAdvanceCentavos !== undefined
                    ? { scaleAdvanceCentavos: body.scaleAdvanceCentavos }
                    : {}),
            },
            update: {
                ...(body.economyMarkupMultiplier !== undefined
                    ? { economyMarkupMultiplier: new Prisma.Decimal(body.economyMarkupMultiplier) }
                    : {}),
                ...(body.premiumMarkupMultiplier !== undefined
                    ? { premiumMarkupMultiplier: new Prisma.Decimal(body.premiumMarkupMultiplier) }
                    : {}),
                ...(body.imageMarkupMultiplier !== undefined
                    ? { imageMarkupMultiplier: new Prisma.Decimal(body.imageMarkupMultiplier) }
                    : {}),
                ...(body.usdToPhpRate !== undefined
                    ? { usdToPhpRate: new Prisma.Decimal(body.usdToPhpRate) }
                    : {}),
                ...(body.quotaReferenceModelId !== undefined
                    ? { quotaReferenceModelId: body.quotaReferenceModelId }
                    : {}),
                ...(body.scaleAdvanceCentavos !== undefined
                    ? { scaleAdvanceCentavos: body.scaleAdvanceCentavos }
                    : {}),
            },
        })
        const modelsUpdated = await recomputeAllModelRetailPrices()
        http.ok(res, {
            settings: {
                economyMarkupMultiplier: settings.economyMarkupMultiplier.toString(),
                premiumMarkupMultiplier: settings.premiumMarkupMultiplier.toString(),
                imageMarkupMultiplier: settings.imageMarkupMultiplier.toString(),
                usdToPhpRate: settings.usdToPhpRate.toString(),
                quotaReferenceModelId: settings.quotaReferenceModelId,
                scaleAdvanceCentavos: settings.scaleAdvanceCentavos,
                updatedAt: settings.updatedAt.toISOString(),
            },
            modelsUpdated,
        })
    }
}

export default new AdminBusinessRoutes()

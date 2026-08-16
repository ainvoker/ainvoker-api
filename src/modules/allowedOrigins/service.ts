import { Prisma } from "../../generated/prisma/client.js"
import { AppError } from "../../platform/errors.js"
import { MAX_ALLOWED_ORIGINS_PER_PROJECT, normalizeOrigin } from "../../platform/origin.js"
import prismaClient from "../../platform/prisma.js"
import projectsService from "../projects/service.js"
import type { z } from "zod"
import type { createAllowedOriginSchema } from "./schemas.js"

class AllowedOriginsService {
    private serialize(row: {
        id: string
        projectId: string
        origin: string
        createdAt: Date
        updatedAt: Date
    }) {
        return {
            id: row.id,
            projectId: row.projectId,
            origin: row.origin,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }
    }

    async list(projectId: string, userId: string) {
        await projectsService.getProjectForMember(projectId, userId)

        const rows = await prismaClient.projectAllowedOrigin.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
        })

        return rows.map((row) => this.serialize(row))
    }

    async create(
        projectId: string,
        userId: string,
        input: z.infer<typeof createAllowedOriginSchema>,
    ) {
        await projectsService.getProjectForMember(projectId, userId)

        const origin = normalizeOrigin(input.origin)

        const count = await prismaClient.projectAllowedOrigin.count({
            where: { projectId },
        })
        if (count >= MAX_ALLOWED_ORIGINS_PER_PROJECT) {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                `A project may have at most ${MAX_ALLOWED_ORIGINS_PER_PROJECT} allowed origins`,
            )
        }

        try {
            const row = await prismaClient.projectAllowedOrigin.create({
                data: { projectId, origin },
            })
            return this.serialize(row)
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new AppError(409, "CONFLICT", "This origin is already allowed for the project")
            }
            throw err
        }
    }

    async remove(projectId: string, originId: string, userId: string) {
        await projectsService.getProjectForMember(projectId, userId)

        const existing = await prismaClient.projectAllowedOrigin.findFirst({
            where: { id: originId, projectId },
        })

        if (!existing) {
            throw new AppError(404, "NOT_FOUND", "Allowed origin not found")
        }

        await prismaClient.projectAllowedOrigin.delete({ where: { id: originId } })
    }

    async isOriginRegistered(origin: string): Promise<boolean> {
        const row = await prismaClient.projectAllowedOrigin.findFirst({
            where: { origin },
            select: { id: true },
        })
        return Boolean(row)
    }

    async isOriginAllowedForProject(projectId: string, origin: string): Promise<boolean> {
        const row = await prismaClient.projectAllowedOrigin.findFirst({
            where: { projectId, origin },
            select: { id: true },
        })
        return Boolean(row)
    }
}

export default new AllowedOriginsService()

import type { NextFunction, Request, Response } from "express"
import { AppError } from "../platform/errors.js"
import apiKeyHasher from "../platform/hash.js"
import prismaClient from "../platform/prisma.js"

class ApiKeyMiddleware {
    constructor() {
        this.handle = this.handle.bind(this)
    }

    async handle(req: Request, _res: Response, next: NextFunction) {
        try {
            const header = req.headers.authorization
            if (!header?.startsWith("Bearer ")) {
                throw new AppError(401, "UNAUTHORIZED", "Missing or invalid Authorization header")
            }

            const token = header.slice("Bearer ".length).trim()
            if (!token) {
                throw new AppError(401, "UNAUTHORIZED", "Missing bearer token")
            }

            if (!token.startsWith("ain_")) {
                throw new AppError(401, "UNAUTHORIZED", "Invalid API key")
            }

            const keyHash = apiKeyHasher.hash(token)
            const apiKey = await prismaClient.apiKey.findUnique({
                where: { keyHash },
                include: {
                    project: {
                        select: {
                            id: true,
                            organizationId: true,
                            status: true,
                        },
                    },
                },
            })

            if (!apiKey || apiKey.status !== "ACTIVE") {
                throw new AppError(401, "UNAUTHORIZED", "Invalid or inactive API key")
            }

            if (apiKey.expiresAt && apiKey.expiresAt.getTime() <= Date.now()) {
                throw new AppError(401, "UNAUTHORIZED", "API key expired")
            }

            if (apiKey.project.status !== "ACTIVE") {
                throw new AppError(403, "FORBIDDEN", "Project is not active")
            }

            req.apiKeyContext = {
                apiKeyId: apiKey.id,
                projectId: apiKey.projectId,
                organizationId: apiKey.project.organizationId,
            }

            await prismaClient.apiKey.update({
                where: { id: apiKey.id },
                data: { lastUsed: new Date() },
            })

            next()
        } catch (err) {
            if (err instanceof AppError) {
                next(err)
                return
            }
            next(new AppError(401, "UNAUTHORIZED", "Invalid API key"))
        }
    }
}

export default new ApiKeyMiddleware().handle

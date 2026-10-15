import type { NextFunction, Request, Response } from "express"
import { assertOrganizationStatusActive } from "../modules/billing/limits.js"
import allowedOriginsService from "../modules/allowedOrigins/service.js"
import { AppError } from "../platform/errors.js"
import apiKeyHasher from "../platform/hash.js"
import { tryNormalizeOrigin } from "../platform/origin.js"
import prismaClient from "../platform/prisma.js"

const LAST_USED_THROTTLE_MS = 60_000

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
                            organization: { select: { status: true } },
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

            assertOrganizationStatusActive(apiKey.project.organization.status)

            const rawOrigin = req.headers.origin
            const hasOrigin = typeof rawOrigin === "string" && rawOrigin.trim().length > 0

            if (apiKey.clientType === "SERVER" && hasOrigin) {
                throw new AppError(
                    403,
                    "ORIGIN_NOT_ALLOWED",
                    "Server API keys cannot be used from a browser origin",
                )
            }

            if (apiKey.clientType === "BROWSER") {
                if (!hasOrigin) {
                    throw new AppError(
                        403,
                        "ORIGIN_REQUIRED",
                        "Browser API keys require an allowed Origin header",
                    )
                }

                const origin = tryNormalizeOrigin(rawOrigin)
                if (!origin) {
                    throw new AppError(403, "ORIGIN_NOT_ALLOWED", "Request origin is not allowed")
                }

                const allowed = await allowedOriginsService.isOriginAllowedForProject(
                    apiKey.projectId,
                    origin,
                )
                if (!allowed) {
                    throw new AppError(
                        403,
                        "ORIGIN_NOT_ALLOWED",
                        "Request origin is not allowed for this project",
                    )
                }
            }

            req.apiKeyContext = {
                apiKeyId: apiKey.id,
                projectId: apiKey.projectId,
                organizationId: apiKey.project.organizationId,
                permissions: apiKey.permissions,
            }

            const now = Date.now()
            if (!apiKey.lastUsed || now - apiKey.lastUsed.getTime() >= LAST_USED_THROTTLE_MS) {
                // Off the request path: lastUsed is informational and minute-granular.
                void prismaClient.apiKey
                    .update({ where: { id: apiKey.id }, data: { lastUsed: new Date(now) } })
                    .catch(() => {})
            }

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

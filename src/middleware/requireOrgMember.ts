import type { NextFunction, Request, Response } from "express";
import { AppError } from "../platform/errors.js";
import prismaService from "../platform/prisma.js";

class OrgMemberMiddleware {
    constructor() {
        this.handle = this.handle.bind(this);
    }

    async handle(req: Request, _res: Response, next: NextFunction) {
        try {
            if (!req.auth) {
                throw new AppError(401, "UNAUTHORIZED", "Authentication required");
            }

            const orgId = req.params.orgId;
            if (!orgId || typeof orgId !== "string") {
                throw new AppError(400, "BAD_REQUEST", "Organization id is required");
            }

            const membership = await prismaService.client.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId: orgId,
                        userId: req.auth.userId,
                    },
                },
                include: { role: true },
            });

            if (!membership) {
                throw new AppError(403, "FORBIDDEN", "You are not a member of this organization");
            }

            req.membership = membership;
            next();
        } catch (err) {
            next(err);
        }
    }
}

export default new OrgMemberMiddleware().handle;

import { AppError } from "../platform/errors.js";
import { prisma } from "../platform/prisma.js";
export async function requireOrgMember(req, _res, next) {
    try {
        if (!req.auth) {
            throw new AppError(401, "UNAUTHORIZED", "Authentication required");
        }
        const orgId = req.params.orgId;
        if (!orgId || typeof orgId !== "string") {
            throw new AppError(400, "BAD_REQUEST", "Organization id is required");
        }
        const membership = await prisma.organizationMember.findUnique({
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
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=requireOrgMember.js.map
import { AppError } from "../../platform/errors.js";
import { generateApiKey } from "../../platform/hash.js";
import { prisma } from "../../platform/prisma.js";
import { getProjectForMember } from "../projects/service.js";
function serializeApiKey(key) {
    return {
        id: key.id,
        projectId: key.projectId,
        keyName: key.keyName,
        keyPrefix: key.keyPrefix,
        permissions: key.permissions,
        lastUsed: key.lastUsed,
        expiresAt: key.expiresAt,
        status: key.status,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
    };
}
export async function listApiKeys(projectId, userId) {
    await getProjectForMember(projectId, userId);
    const keys = await prisma.apiKey.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
    });
    return keys.map(serializeApiKey);
}
export async function createApiKey(projectId, userId, input) {
    await getProjectForMember(projectId, userId);
    const { plaintext, keyHash, keyPrefix } = generateApiKey();
    const key = await prisma.apiKey.create({
        data: {
            projectId,
            keyName: input.keyName,
            keyHash,
            keyPrefix,
            expiresAt: input.expiresAt ?? null,
            ...(input.permissions !== undefined
                ? { permissions: input.permissions }
                : {}),
        },
    });
    return {
        ...serializeApiKey(key),
        apiKey: plaintext,
    };
}
export async function revokeApiKey(projectId, keyId, userId) {
    await getProjectForMember(projectId, userId);
    const existing = await prisma.apiKey.findFirst({
        where: { id: keyId, projectId },
    });
    if (!existing) {
        throw new AppError(404, "NOT_FOUND", "API key not found");
    }
    const key = await prisma.apiKey.update({
        where: { id: keyId },
        data: { status: "REVOKED" },
    });
    return serializeApiKey(key);
}
export async function deleteApiKey(projectId, keyId, userId) {
    await getProjectForMember(projectId, userId);
    const existing = await prisma.apiKey.findFirst({
        where: { id: keyId, projectId },
    });
    if (!existing) {
        throw new AppError(404, "NOT_FOUND", "API key not found");
    }
    await prisma.apiKey.delete({ where: { id: keyId } });
}
//# sourceMappingURL=service.js.map
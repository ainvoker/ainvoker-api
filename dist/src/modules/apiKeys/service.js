import { AppError } from "../../platform/errors.js";
import apiKeyHasher from "../../platform/hash.js";
import prismaClient from "../../platform/prisma.js";
import projectsService from "../projects/service.js";
class ApiKeyService {
    serializeApiKey(key) {
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
    async listApiKeys(projectId, userId) {
        await projectsService.getProjectForMember(projectId, userId);
        const keys = await prismaClient.apiKey.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
        });
        return keys.map((key) => this.serializeApiKey(key));
    }
    async createApiKey(projectId, userId, input) {
        await projectsService.getProjectForMember(projectId, userId);
        const { plaintext, keyHash, keyPrefix } = apiKeyHasher.generate();
        const key = await prismaClient.apiKey.create({
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
            ...this.serializeApiKey(key),
            apiKey: plaintext,
        };
    }
    async revokeApiKey(projectId, keyId, userId) {
        await projectsService.getProjectForMember(projectId, userId);
        const existing = await prismaClient.apiKey.findFirst({
            where: { id: keyId, projectId },
        });
        if (!existing) {
            throw new AppError(404, "NOT_FOUND", "API key not found");
        }
        const key = await prismaClient.apiKey.update({
            where: { id: keyId },
            data: { status: "REVOKED" },
        });
        return this.serializeApiKey(key);
    }
    async deleteApiKey(projectId, keyId, userId) {
        await projectsService.getProjectForMember(projectId, userId);
        const existing = await prismaClient.apiKey.findFirst({
            where: { id: keyId, projectId },
        });
        if (!existing) {
            throw new AppError(404, "NOT_FOUND", "API key not found");
        }
        await prismaClient.apiKey.delete({ where: { id: keyId } });
    }
}
export default new ApiKeyService();
//# sourceMappingURL=service.js.map
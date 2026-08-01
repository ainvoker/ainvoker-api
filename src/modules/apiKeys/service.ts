import type { Prisma } from "../../../generated/prisma/client.js";
import { AppError } from "../../platform/errors.js";
import apiKeyHasher from "../../platform/hash.js";
import prismaClient from "../../platform/prisma.js";
import projectsService from "../projects/service.js";
import type { z } from "zod";
import type { createApiKeySchema } from "./schemas.js";

class ApiKeyService {
    private serializeApiKey(key: {
        id: string;
        projectId: string;
        keyName: string;
        keyPrefix: string;
        permissions: Prisma.JsonValue | null;
        lastUsed: Date | null;
        expiresAt: Date | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }) {
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

    async listApiKeys(projectId: string, userId: string) {
        await projectsService.getProjectForMember(projectId, userId);

        const keys = await prismaClient.apiKey.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
        });

        return keys.map((key) => this.serializeApiKey(key));
    }

    async createApiKey(
        projectId: string,
        userId: string,
        input: z.infer<typeof createApiKeySchema>,
    ) {
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
                    ? { permissions: input.permissions as Prisma.InputJsonValue }
                    : {}),
            },
        });

        return {
            ...this.serializeApiKey(key),
            apiKey: plaintext,
        };
    }

    async revokeApiKey(projectId: string, keyId: string, userId: string) {
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

    async deleteApiKey(projectId: string, keyId: string, userId: string) {
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

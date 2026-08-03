import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"
import {
    apiKeyParamsSchema,
    createApiKeySchema,
    projectIdParamsSchema,
    orgIdParamsSchema,
    createProjectSchema,
    projectParamsSchema,
    updateProjectSchema,
    bootstrapProfileSchema, 
    updateProfileSchema
} from "./schemas.js"
import {
    apiKeySchema,
    createdApiKeySchema,
    dataEnvelope,
    deletedResponseSchema,
    errorResponseSchema,
    healthSchema,
    meResponseSchema,
    organizationListItemSchema,
    projectSchema,
    rootMessageSchema,
    userSchema,
} from "./responses.js"

const bearerAuth = [{ bearerAuth: [] }]

const errorResponses = {
    400: {
        description: "Validation error",
        content: { "application/json": { schema: errorResponseSchema } },
    },
    401: {
        description: "Unauthorized",
        content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
        description: "Forbidden",
        content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
        description: "Not found",
        content: { "application/json": { schema: errorResponseSchema } },
    },
    409: {
        description: "Conflict",
        content: { "application/json": { schema: errorResponseSchema } },
    },
}

export function registerApiPaths(registry: OpenAPIRegistry) {
    registry.registerPath({
        method: "get",
        path: "/",
        tags: ["System"],
        summary: "API root",
        responses: {
            200: {
                description: "API identity",
                content: { "application/json": { schema: rootMessageSchema } },
            },
        },
    })

    registry.registerPath({
        method: "get",
        path: "/health",
        tags: ["System"],
        summary: "Health check",
        responses: {
            200: {
                description: "Service is healthy",
                content: { "application/json": { schema: healthSchema } },
            },
        },
    })

    registry.registerPath({
        method: "get",
        path: "/api/v1/me",
        tags: ["Users"],
        summary: "Get current user profile and memberships",
        description: "Ensures the app user and Personal org exist (lazy bootstrap).",
        security: bearerAuth,
        responses: {
            200: {
                description: "Current user and memberships",
                content: { "application/json": { schema: dataEnvelope(meResponseSchema) } },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "post",
        path: "/api/v1/me/bootstrap",
        tags: ["Users"],
        summary: "Bootstrap user and Personal organization",
        description: "Idempotent create of app User + Personal org. Optionally seeds profile fields.",
        security: bearerAuth,
        request: {
            body: {
                content: {
                    "application/json": { schema: bootstrapProfileSchema },
                },
            },
        },
        responses: {
            200: {
                description: "Current user and memberships",
                content: { "application/json": { schema: dataEnvelope(meResponseSchema) } },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "patch",
        path: "/api/v1/me",
        tags: ["Users"],
        summary: "Update current user profile",
        security: bearerAuth,
        request: {
            body: {
                required: true,
                content: {
                    "application/json": { schema: updateProfileSchema },
                },
            },
        },
        responses: {
            200: {
                description: "Updated user",
                content: { "application/json": { schema: dataEnvelope(userSchema) } },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "get",
        path: "/api/v1/organizations",
        tags: ["Organizations"],
        summary: "List organizations for the current user",
        security: bearerAuth,
        responses: {
            200: {
                description: "Organizations with the caller's role",
                content: {
                    "application/json": {
                        schema: dataEnvelope(z.array(organizationListItemSchema)),
                    },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "get",
        path: "/api/v1/organizations/{orgId}/projects",
        tags: ["Projects"],
        summary: "List projects in an organization",
        security: bearerAuth,
        request: {
            params: orgIdParamsSchema,
        },
        responses: {
            200: {
                description: "Projects in the organization",
                content: {
                    "application/json": { schema: dataEnvelope(z.array(projectSchema)) },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "post",
        path: "/api/v1/organizations/{orgId}/projects",
        tags: ["Projects"],
        summary: "Create a project",
        security: bearerAuth,
        request: {
            params: orgIdParamsSchema,
            body: {
                required: true,
                content: {
                    "application/json": { schema: createProjectSchema },
                },
            },
        },
        responses: {
            201: {
                description: "Created project",
                content: { "application/json": { schema: dataEnvelope(projectSchema) } },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "get",
        path: "/api/v1/projects/{projectId}",
        tags: ["Projects"],
        summary: "Get a project",
        security: bearerAuth,
        request: {
            params: projectParamsSchema,
        },
        responses: {
            200: {
                description: "Project",
                content: { "application/json": { schema: dataEnvelope(projectSchema) } },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "patch",
        path: "/api/v1/projects/{projectId}",
        tags: ["Projects"],
        summary: "Update a project",
        security: bearerAuth,
        request: {
            params: projectParamsSchema,
            body: {
                required: true,
                content: {
                    "application/json": { schema: updateProjectSchema },
                },
            },
        },
        responses: {
            200: {
                description: "Updated project",
                content: { "application/json": { schema: dataEnvelope(projectSchema) } },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "delete",
        path: "/api/v1/projects/{projectId}",
        tags: ["Projects"],
        summary: "Delete a project",
        security: bearerAuth,
        request: {
            params: projectParamsSchema,
        },
        responses: {
            200: {
                description: "Project deleted",
                content: { "application/json": { schema: dataEnvelope(deletedResponseSchema) } },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "get",
        path: "/api/v1/projects/{projectId}/api-keys",
        tags: ["API Keys"],
        summary: "List API keys for a project",
        security: bearerAuth,
        request: {
            params: projectIdParamsSchema,
        },
        responses: {
            200: {
                description: "API keys (plaintext secret is never returned)",
                content: {
                    "application/json": { schema: dataEnvelope(z.array(apiKeySchema)) },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "post",
        path: "/api/v1/projects/{projectId}/api-keys",
        tags: ["API Keys"],
        summary: "Create an API key",
        description: "Returns the plaintext `apiKey` once. Store it immediately.",
        security: bearerAuth,
        request: {
            params: projectIdParamsSchema,
            body: {
                required: true,
                content: {
                    "application/json": { schema: createApiKeySchema },
                },
            },
        },
        responses: {
            201: {
                description: "Created API key including one-time plaintext secret",
                content: { "application/json": { schema: dataEnvelope(createdApiKeySchema) } },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "post",
        path: "/api/v1/projects/{projectId}/api-keys/{keyId}/revoke",
        tags: ["API Keys"],
        summary: "Revoke an API key",
        security: bearerAuth,
        request: {
            params: apiKeyParamsSchema,
        },
        responses: {
            200: {
                description: "Revoked API key",
                content: { "application/json": { schema: dataEnvelope(apiKeySchema) } },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "delete",
        path: "/api/v1/projects/{projectId}/api-keys/{keyId}",
        tags: ["API Keys"],
        summary: "Delete an API key",
        security: bearerAuth,
        request: {
            params: apiKeyParamsSchema,
        },
        responses: {
            200: {
                description: "API key deleted",
                content: { "application/json": { schema: dataEnvelope(deletedResponseSchema) } },
            },
            ...errorResponses,
        },
    })
}

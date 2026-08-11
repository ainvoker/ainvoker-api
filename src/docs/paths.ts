import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"
import {
    apiKeyParamsSchema,
    createApiKeySchema,
    projectIdParamsSchema,
    orgIdParamsSchema,
    createOrganizationSchema,
    createCheckoutSessionSchema,
    orgSubscriptionResponseSchema,
    createProjectSchema,
    projectParamsSchema,
    updateProjectSchema,
    bootstrapProfileSchema,
    updateProfileSchema,
    textChatSchema,
    aiRequestParamsSchema,
    listAiRequestsQuerySchema,
} from "./schemas.js"
import {
    apiKeySchema,
    aiRequestDetailSchema,
    aiRequestListSchema,
    createdApiKeySchema,
    dataEnvelope,
    deletedResponseSchema,
    errorResponseSchema,
    healthSchema,
    meResponseSchema,
    organizationListItemSchema,
    projectSchema,
    rootMessageSchema,
    textChatResponseSchema,
    userSchema,
} from "./responses.js"

const bearerAuth = [{ bearerAuth: [] }]
const apiKeyAuth = [{ apiKeyAuth: [] }]

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
        method: "post",
        path: "/api/v1/organizations",
        tags: ["Organizations"],
        summary: "Create an organization",
        description:
            "Create an additional organization with Pro (`plan: pro`). Pro subscription starts PENDING until Xendit checkout completes. Scale requires contact sales.",
        security: bearerAuth,
        request: {
            body: {
                required: true,
                content: {
                    "application/json": { schema: createOrganizationSchema },
                },
            },
        },
        responses: {
            201: {
                description: "Created organization (caller is owner)",
                content: {
                    "application/json": { schema: dataEnvelope(organizationListItemSchema) },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "get",
        path: "/api/v1/organizations/{orgId}/subscription",
        tags: ["Billing"],
        summary: "Get organization subscription",
        security: bearerAuth,
        request: { params: orgIdParamsSchema },
        responses: {
            200: {
                description: "Current subscription for the organization",
                content: {
                    "application/json": { schema: dataEnvelope(orgSubscriptionResponseSchema) },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "post",
        path: "/api/v1/organizations/{orgId}/checkout-sessions",
        tags: ["Billing"],
        summary: "Create Xendit Components checkout session (Pro)",
        description:
            "Returns `componentsSdkKey` for embedded Xendit Components checkout. Requires `BILLING_ENABLED=true` and org owner/admin.",
        security: bearerAuth,
        request: {
            params: orgIdParamsSchema,
            body: {
                required: true,
                content: {
                    "application/json": { schema: createCheckoutSessionSchema },
                },
            },
        },
        responses: {
            201: {
                description: "Checkout session created",
                content: {
                    "application/json": {
                        schema: dataEnvelope(
                            z.object({
                                componentsSdkKey: z.string(),
                                sessionId: z.string(),
                                expiresAt: z.string().nullable(),
                            }),
                        ),
                    },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "post",
        path: "/api/v1/billing/webhooks/xendit",
        tags: ["Billing"],
        summary: "Xendit webhook receiver",
        description: "Verifies `x-callback-token` and activates subscriptions on successful payment.",
        responses: {
            200: {
                description: "Webhook processed",
                content: {
                    "application/json": {
                        schema: dataEnvelope(
                            z.object({
                                handled: z.boolean(),
                            }),
                        ),
                    },
                },
            },
            401: {
                description: "Invalid webhook token",
                content: { "application/json": { schema: errorResponseSchema } },
            },
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

    registry.registerPath({
        method: "get",
        path: "/api/v1/projects/{projectId}/ai-requests",
        tags: ["AI Requests"],
        summary: "List AI requests for a project",
        description:
            "Returns paginated request summaries (newest first). Use `status`, `limit`, and `offset` query params. Full payloads are available on the detail endpoint.",
        security: bearerAuth,
        request: {
            params: projectIdParamsSchema,
            query: listAiRequestsQuerySchema,
        },
        responses: {
            200: {
                description: "Paginated AI request summaries",
                content: {
                    "application/json": { schema: dataEnvelope(aiRequestListSchema) },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "get",
        path: "/api/v1/projects/{projectId}/ai-requests/{requestId}",
        tags: ["AI Requests"],
        summary: "Get an AI request",
        description: "Returns full request and response payloads for a single AI request.",
        security: bearerAuth,
        request: {
            params: aiRequestParamsSchema,
        },
        responses: {
            200: {
                description: "AI request detail",
                content: {
                    "application/json": { schema: dataEnvelope(aiRequestDetailSchema) },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "post",
        path: "/v1/text/chat",
        tags: ["Gateway"],
        summary: "Text chat completion",
        description:
            "Invoke a text chat model via the data plane. Authenticate with a project API key (`Authorization: Bearer ain_…`). Model must be a `provider/model` slug (e.g. `openai/gpt-4o-mini` or `gemini/gemini-3.6-flash`). Free plans may only call `freeEligible` catalog models and are subject to monthly request/token caps.",
        security: apiKeyAuth,
        request: {
            body: {
                content: {
                    "application/json": { schema: textChatSchema },
                },
            },
        },
        responses: {
            200: {
                description: "Assistant message",
                content: {
                    "application/json": { schema: dataEnvelope(textChatResponseSchema) },
                },
            },
            402: {
                description: "Organization has no active subscription",
                content: { "application/json": { schema: errorResponseSchema } },
            },
            429: {
                description: "Monthly plan request or token limit exceeded",
                content: { "application/json": { schema: errorResponseSchema } },
            },
            501: {
                description: "Provider adapter not implemented",
                content: { "application/json": { schema: errorResponseSchema } },
            },
            ...errorResponses,
        },
    })
}

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi"
import { z } from "zod"
import {
    acceptInviteSchema,
    allowedOriginParamsSchema,
    apiKeyParamsSchema,
    createAllowedOriginSchema,
    createApiKeySchema,
    createInviteSchema,
    projectIdParamsSchema,
    orgIdParamsSchema,
    createOrganizationSchema,
    updateOrganizationSchema,
    createCheckoutSessionSchema,
    orgSubscriptionResponseSchema,
    invoiceItemSchema,
    cancelSubscriptionResponseSchema,
    createProjectSchema,
    projectParamsSchema,
    updateProjectSchema,
    bootstrapProfileSchema,
    updateProfileSchema,
    textChatSchema,
    imageGenerateSchema,
    projectModelParamsSchema,
    toggleProjectModelSchema,
    aiRequestParamsSchema,
    listAiRequestsQuerySchema,
    projectAnalyticsQuerySchema,
    inviteIdParamsSchema,
    memberIdParamsSchema,
    previewInviteQuerySchema,
    transferOwnershipSchema,
    updateMemberRoleSchema,
} from "./schemas.js"
import {
    acceptInviteResponseSchema,
    allowedOriginSchema,
    apiKeySchema,
    aiRequestDetailSchema,
    aiRequestListSchema,
    createdApiKeySchema,
    dataEnvelope,
    deletedResponseSchema,
    errorResponseSchema,
    healthSchema,
    imageGenerateResponseSchema,
    inviteItemSchema,
    invitePreviewSchema,
    meResponseSchema,
    memberListItemSchema,
    organizationListItemSchema,
    organizationUsageSchema,
    projectAnalyticsSchema,
    projectModelSchema,
    projectSchema,
    projectUsageSchema,
    rootMessageSchema,
    textChatResponseSchema,
    textStreamDeltaEventSchema,
    textStreamDoneEventSchema,
    textStreamErrorEventSchema,
    textStreamMetaEventSchema,
    textStreamToolCallEventSchema,
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
        path: "/api/v1/organizations/{orgId}",
        tags: ["Organizations"],
        summary: "Get an organization",
        description:
            "Return a workspace the caller belongs to, including isPersonal and edit/delete permissions.",
        security: bearerAuth,
        request: { params: orgIdParamsSchema },
        responses: {
            200: {
                description: "Organization with the caller's role and permissions",
                content: {
                    "application/json": { schema: dataEnvelope(organizationListItemSchema) },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "patch",
        path: "/api/v1/organizations/{orgId}",
        tags: ["Organizations"],
        summary: "Update an organization",
        description:
            "Owner or admin. Rename a workspace and optionally change its slug. Personal workspaces cannot be renamed.",
        security: bearerAuth,
        request: {
            params: orgIdParamsSchema,
            body: {
                required: true,
                content: {
                    "application/json": { schema: updateOrganizationSchema },
                },
            },
        },
        responses: {
            200: {
                description: "Updated organization with the caller's role",
                content: {
                    "application/json": { schema: dataEnvelope(organizationListItemSchema) },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "delete",
        path: "/api/v1/organizations/{orgId}",
        tags: ["Organizations"],
        summary: "Soft-delete an organization",
        description:
            "Owner-only. Marks the organization DELETED and cancels its subscriptions. Personal workspaces cannot be deleted.",
        security: bearerAuth,
        request: { params: orgIdParamsSchema },
        responses: {
            200: {
                description: "Organization soft-deleted",
                content: {
                    "application/json": { schema: dataEnvelope(deletedResponseSchema) },
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
        method: "get",
        path: "/api/v1/organizations/{orgId}/invoices",
        tags: ["Billing"],
        summary: "List organization invoices",
        description: "Owner/admin only. Returns payment transactions for the organization.",
        security: bearerAuth,
        request: { params: orgIdParamsSchema },
        responses: {
            200: {
                description: "Invoice list",
                content: {
                    "application/json": {
                        schema: dataEnvelope(z.array(invoiceItemSchema)),
                    },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "post",
        path: "/api/v1/organizations/{orgId}/subscription/cancel",
        tags: ["Billing"],
        summary: "Cancel paid subscription at period end",
        description:
            "Owner/admin only. Stops future Xendit charges; Pro access continues until renewsAt/expiresAt.",
        security: bearerAuth,
        request: { params: orgIdParamsSchema },
        responses: {
            200: {
                description: "Cancellation scheduled",
                content: {
                    "application/json": {
                        schema: dataEnvelope(cancelSubscriptionResponseSchema),
                    },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "get",
        path: "/api/v1/organizations/{orgId}/usage",
        tags: ["Usage"],
        summary: "Get organization usage dashboard",
        description:
            "Returns plan snapshot (null-safe), current UTC-month usage, per-project and per-model breakdown, daily UTC series, and recent AI requests across the organization.",
        security: bearerAuth,
        request: { params: orgIdParamsSchema },
        responses: {
            200: {
                description: "Organization usage snapshot",
                content: {
                    "application/json": { schema: dataEnvelope(organizationUsageSchema) },
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
            "Creates a recurring SUBSCRIPTION payment session and returns `componentsSdkKey` for embedded Xendit Components. Requires `BILLING_ENABLED=true` and org owner/admin.",
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
        description:
            "Verifies `x-callback-token` and activates/renews subscriptions on payment and recurring cycle events.",
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
        path: "/api/v1/projects/{projectId}/allowed-origins",
        tags: ["Allowed Origins"],
        summary: "List allowed browser origins for a project",
        description:
            "Origins allowed to call the SDK gateway (`/v1`) from a browser for this project.",
        security: bearerAuth,
        request: {
            params: projectIdParamsSchema,
        },
        responses: {
            200: {
                description: "Allowed origins",
                content: {
                    "application/json": { schema: dataEnvelope(z.array(allowedOriginSchema)) },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "post",
        path: "/api/v1/projects/{projectId}/allowed-origins",
        tags: ["Allowed Origins"],
        summary: "Add an allowed browser origin",
        description:
            "Provide scheme + host (+ optional port), e.g. `https://app.example.com` or `http://localhost:5173`.",
        security: bearerAuth,
        request: {
            params: projectIdParamsSchema,
            body: {
                required: true,
                content: {
                    "application/json": { schema: createAllowedOriginSchema },
                },
            },
        },
        responses: {
            201: {
                description: "Created allowed origin",
                content: { "application/json": { schema: dataEnvelope(allowedOriginSchema) } },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "delete",
        path: "/api/v1/projects/{projectId}/allowed-origins/{originId}",
        tags: ["Allowed Origins"],
        summary: "Remove an allowed browser origin",
        security: bearerAuth,
        request: {
            params: allowedOriginParamsSchema,
        },
        responses: {
            200: {
                description: "Allowed origin deleted",
                content: { "application/json": { schema: dataEnvelope(deletedResponseSchema) } },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "get",
        path: "/api/v1/projects/{projectId}/models",
        tags: ["Project Models"],
        summary: "List models for a project",
        description:
            "Returns the curated text and image catalog with per-project enabled flags. Plan-forbidden models are locked.",
        security: bearerAuth,
        request: {
            params: projectIdParamsSchema,
        },
        responses: {
            200: {
                description: "Project model allowlist",
                content: {
                    "application/json": { schema: dataEnvelope(z.array(projectModelSchema)) },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "patch",
        path: "/api/v1/projects/{projectId}/models/{modelId}",
        tags: ["Project Models"],
        summary: "Enable or disable a project model",
        description:
            "Owner or admin only. Locked (plan-forbidden) models cannot be toggled.",
        security: bearerAuth,
        request: {
            params: projectModelParamsSchema,
            body: {
                required: true,
                content: {
                    "application/json": { schema: toggleProjectModelSchema },
                },
            },
        },
        responses: {
            200: {
                description: "Updated project model",
                content: { "application/json": { schema: dataEnvelope(projectModelSchema) } },
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
        path: "/api/v1/projects/{projectId}/usage",
        tags: ["Usage"],
        summary: "Get project usage overview",
        description:
            "Returns current UTC-month usage for the project, workspace period totals, per-model breakdown, daily UTC series, API key counts, plan snapshot for the parent organization, and recent AI requests.",
        security: bearerAuth,
        request: {
            params: projectIdParamsSchema,
        },
        responses: {
            200: {
                description: "Project usage snapshot",
                content: {
                    "application/json": { schema: dataEnvelope(projectUsageSchema) },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "get",
        path: "/api/v1/projects/{projectId}/analytics",
        tags: ["Usage"],
        summary: "Get project analytics",
        description:
            "Returns project usage for a UTC range (current billing month, or rolling 7 or 30 days ending today): totals with token split and cost, latency avg/p50/p95, workspace totals for the same range, per-model and per-API-key breakdowns, daily series with stacked segments, and recent AI requests in the range.",
        security: bearerAuth,
        request: {
            params: projectIdParamsSchema,
            query: projectAnalyticsQuerySchema,
        },
        responses: {
            200: {
                description: "Project analytics snapshot",
                content: {
                    "application/json": { schema: dataEnvelope(projectAnalyticsSchema) },
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
            "Invoke a text chat model via the data plane. Authenticate with a project API key (`Authorization: Bearer ain_…`). Model may be a `provider/model` slug (e.g. `openai/gpt-4o-mini`) or a bare model name when exactly one ACTIVE catalog row matches. Free plans may only call `freeEligible` catalog models. The project allowlist must enable the model. Subject to monthly request/token caps. Optional `tools` (max 32) are forwarded to the vendor; tool calls come back on `message.toolCalls` with `content` \"\" on a tool-only reply. The gateway does not run tools: the caller runs them and sends the result as a `tool` message on the next request.",
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

    registry.registerPath({
        method: "post",
        path: "/v1/text/stream",
        tags: ["Gateway"],
        summary: "Text chat streaming (SSE)",
        description:
            "Same request body, catalog resolution, plan gates, project allowlist, and quota reserve as `POST /v1/text/chat`. On success returns `text/event-stream` (not a `{ data }` JSON envelope). SSE events use an `event:` name and JSON on `data:`: `meta` once (`{ id, model }`), zero or more `delta` (`{ content }`), one `tool_call` (`{ id, name, arguments }`) per complete tool call, then `done` (`{ message, usage }`, where `message.toolCalls` repeats the emitted calls). The gateway does not run tools; the caller runs them and sends a `tool` message on the next request. Failures after headers are sent use `error` (`{ code, message }`) then close. Pre-stream failures (invalid body, unknown model, plan/allowlist/quota) return the normal JSON `{ error }` envelope before any SSE headers. Sets the same `X-RateLimit-*` headers as chat before the first event.",
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
                description:
                    "Server-Sent Events stream. Event names: meta, delta, tool_call, done, error. Payloads match TextStream* schemas (no wrapping `type` field on the wire).",
                content: {
                    "text/event-stream": {
                        schema: z.union([
                            textStreamMetaEventSchema,
                            textStreamDeltaEventSchema,
                            textStreamToolCallEventSchema,
                            textStreamDoneEventSchema,
                            textStreamErrorEventSchema,
                        ]),
                    },
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

    registry.registerPath({
        method: "post",
        path: "/v1/image/generate",
        tags: ["Gateway"],
        summary: "Image generation",
        description:
            "Generate images from a text prompt. Authenticate with a project API key (`Authorization: Bearer ain_…`). Model resolution, project allowlist, and monthly request/token caps work the same as `POST /v1/text/chat`. No image model is available on the Free plan (`403 MODEL_NOT_ALLOWED_ON_PLAN`). Images come back base64-encoded; the gateway does not store image bytes. Each requested image reserves 8,000 output tokens against the monthly cap until the provider reports actual usage.",
        security: apiKeyAuth,
        request: {
            body: {
                content: {
                    "application/json": { schema: imageGenerateSchema },
                },
            },
        },
        responses: {
            200: {
                description: "Generated images",
                content: {
                    "application/json": { schema: dataEnvelope(imageGenerateResponseSchema) },
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

    registry.registerPath({
        method: "get",
        path: "/api/v1/organizations/{orgId}/members",
        tags: ["Members"],
        summary: "List organization members",
        security: bearerAuth,
        request: { params: orgIdParamsSchema },
        responses: {
            200: {
                description: "Member list",
                content: {
                    "application/json": {
                        schema: dataEnvelope(z.array(memberListItemSchema)),
                    },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "post",
        path: "/api/v1/organizations/{orgId}/invites",
        tags: ["Members"],
        summary: "Create an organization invite",
        description:
            "Owner/admin only. Stores a hash of the invite token and emails the accept link to the invitee. The response has no raw token. acceptUrl is omitted when email delivery succeeds; it is returned only when INVITE_RETURN_ACCEPT_URL=true (local/dev).",
        security: bearerAuth,
        request: {
            params: orgIdParamsSchema,
            body: {
                required: true,
                content: { "application/json": { schema: createInviteSchema } },
            },
        },
        responses: {
            201: {
                description: "Invite created. Email delivery status is included; the accept secret is not.",
                content: {
                    "application/json": { schema: dataEnvelope(inviteItemSchema) },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "get",
        path: "/api/v1/organizations/{orgId}/invites",
        tags: ["Members"],
        summary: "List pending invites",
        security: bearerAuth,
        request: { params: orgIdParamsSchema },
        responses: {
            200: {
                description: "Pending invites",
                content: {
                    "application/json": {
                        schema: dataEnvelope(z.array(inviteItemSchema)),
                    },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "delete",
        path: "/api/v1/organizations/{orgId}/invites/{inviteId}",
        tags: ["Members"],
        summary: "Revoke a pending invite",
        security: bearerAuth,
        request: { params: inviteIdParamsSchema },
        responses: {
            200: {
                description: "Invite revoked",
                content: {
                    "application/json": { schema: dataEnvelope(deletedResponseSchema) },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "post",
        path: "/api/v1/organizations/{orgId}/invites/{inviteId}/resend",
        tags: ["Members"],
        summary: "Rotate invite token",
        description:
            "Owner/admin only. Rotates the stored token hash and emails a new accept link. The response has no raw token. acceptUrl is omitted when email delivery succeeds.",
        security: bearerAuth,
        request: { params: inviteIdParamsSchema },
        responses: {
            200: {
                description: "Invite resent. Email delivery status is included; the accept secret is not.",
                content: {
                    "application/json": { schema: dataEnvelope(inviteItemSchema) },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "patch",
        path: "/api/v1/organizations/{orgId}/members/{memberId}",
        tags: ["Members"],
        summary: "Update a member role",
        description:
            "Owner/admin can set admin/member. Promoting to owner transfers ownership (owner only).",
        security: bearerAuth,
        request: {
            params: memberIdParamsSchema,
            body: {
                required: true,
                content: { "application/json": { schema: updateMemberRoleSchema } },
            },
        },
        responses: {
            200: {
                description: "Updated member",
                content: {
                    "application/json": { schema: dataEnvelope(memberListItemSchema) },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "delete",
        path: "/api/v1/organizations/{orgId}/members/{memberId}",
        tags: ["Members"],
        summary: "Remove a member",
        security: bearerAuth,
        request: { params: memberIdParamsSchema },
        responses: {
            200: {
                description: "Member removed",
                content: {
                    "application/json": { schema: dataEnvelope(deletedResponseSchema) },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "post",
        path: "/api/v1/organizations/{orgId}/transfer-ownership",
        tags: ["Members"],
        summary: "Transfer workspace ownership",
        security: bearerAuth,
        request: {
            params: orgIdParamsSchema,
            body: {
                required: true,
                content: { "application/json": { schema: transferOwnershipSchema } },
            },
        },
        responses: {
            200: {
                description: "New owner membership",
                content: {
                    "application/json": { schema: dataEnvelope(memberListItemSchema) },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "post",
        path: "/api/v1/organizations/{orgId}/leave",
        tags: ["Members"],
        summary: "Leave the organization",
        security: bearerAuth,
        request: { params: orgIdParamsSchema },
        responses: {
            200: {
                description: "Left the organization",
                content: {
                    "application/json": { schema: dataEnvelope(deletedResponseSchema) },
                },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "post",
        path: "/api/v1/invites/accept",
        tags: ["Members"],
        summary: "Accept an organization invite",
        security: bearerAuth,
        request: {
            body: {
                required: true,
                content: { "application/json": { schema: acceptInviteSchema } },
            },
        },
        responses: {
            200: {
                description: "Membership created",
                content: {
                    "application/json": {
                        schema: dataEnvelope(acceptInviteResponseSchema),
                    },
                },
            },
            410: {
                description: "Invite expired",
                content: { "application/json": { schema: errorResponseSchema } },
            },
            ...errorResponses,
        },
    })

    registry.registerPath({
        method: "get",
        path: "/api/v1/invites/preview",
        tags: ["Members"],
        summary: "Preview an invite by token",
        description: "Public endpoint; token is the capability. Returns org name, role, email, expiry.",
        request: { query: previewInviteQuerySchema },
        responses: {
            200: {
                description: "Invite preview",
                content: {
                    "application/json": { schema: dataEnvelope(invitePreviewSchema) },
                },
            },
            ...errorResponses,
        },
    })
}

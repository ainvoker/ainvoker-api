import {
    OpenAPIRegistry,
    OpenApiGeneratorV3,
    extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi"
import { z } from "zod"
import { registerApiPaths } from "./paths.js"

extendZodWithOpenApi(z)

const registry = new OpenAPIRegistry()

registry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description:
        "Neon Auth / Better Auth session: send `Authorization: Bearer <token>` (JWT or opaque session token).",
})

registry.registerComponent("securitySchemes", "apiKeyAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "API Key",
    description:
        "Project API key for the data plane: send `Authorization: Bearer ain_…` (plaintext key shown once on create).",
})

registerApiPaths(registry)

export function buildOpenApiDocument() {
    const generator = new OpenApiGeneratorV3(registry.definitions)

    return generator.generateDocument({
        openapi: "3.0.3",
        info: {
            title: "AInvoker API",
            version: "1.0.0",
            description: "HTTP API for AInvoker control plane and data-plane gateway.",
        },
        servers: [{ url: "/", description: "Current host" }],
        tags: [
            { name: "System", description: "Health and service identity" },
            { name: "Users", description: "Authenticated user profile" },
            { name: "Organizations", description: "Organizations the user belongs to" },
            { name: "Projects", description: "Organization projects" },
            { name: "API Keys", description: "Project API keys" },
            {
                name: "Allowed Origins",
                description: "Browser origins allowed to call the SDK gateway for a project",
            },
            { name: "AI Requests", description: "Logged gateway invocations for a project" },
            { name: "Usage", description: "Organization and project usage dashboards" },
            { name: "Gateway", description: "Data-plane model invocation (API key auth)" },
            { name: "Billing", description: "Subscriptions and checkout" },
        ],
    })
}

import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi, } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registerApiPaths } from "./paths.js";
extendZodWithOpenApi(z);
const registry = new OpenAPIRegistry();
registry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "Neon Auth / Better Auth session: send `Authorization: Bearer <token>` (JWT or opaque session token).",
});
registerApiPaths(registry);
export function buildOpenApiDocument() {
    const generator = new OpenApiGeneratorV3(registry.definitions);
    return generator.generateDocument({
        openapi: "3.0.3",
        info: {
            title: "AInvoker API",
            version: "1.0.0",
            description: "HTTP API for AInvoker platform resources.",
        },
        servers: [{ url: "/", description: "Current host" }],
        tags: [
            { name: "System", description: "Health and service identity" },
            { name: "Users", description: "Authenticated user profile" },
            { name: "Organizations", description: "Organizations the user belongs to" },
            { name: "Projects", description: "Organization projects" },
            { name: "API Keys", description: "Project API keys" },
        ],
    });
}
//# sourceMappingURL=openapi.js.map
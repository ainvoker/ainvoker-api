import type { Express } from "express"
import swaggerUi from "swagger-ui-express"
import { buildOpenApiDocument } from "../docs/openapi.js"

export function mountSwagger(app: Express) {
    const document = buildOpenApiDocument()

    app.get("/docs.json", (_req, res) => {
        res.json(document)
    })

    app.use("/docs", swaggerUi.serve, swaggerUi.setup(document, {
        customSiteTitle: "AInvoker API Docs",
        swaggerOptions: {
            persistAuthorization: true,
        },
    }))
}

import swaggerUi from "swagger-ui-express";
import { buildOpenApiDocument } from "../docs/openapi.js";
export function mountSwagger(app) {
    const document = buildOpenApiDocument();
    app.get("/docs.json", (_req, res) => {
        res.json(document);
    });
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(document, {
        customSiteTitle: "AInvoker API Docs",
        swaggerOptions: {
            persistAuthorization: true,
        },
    }));
}
//# sourceMappingURL=swagger.js.map
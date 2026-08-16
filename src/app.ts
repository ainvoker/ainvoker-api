import cors from "cors"
import express from "express"
import type { Express, NextFunction, Request, Response } from "express"
import errorHandler from "./platform/errors.js"
import { mountSwagger } from "./platform/swagger.js"
import { dashboardCorsOptions, gatewayCorsOptions } from "./platform/cors.js"
import gatewayRoutes from "./routes/gateway.js"
import apiV1Routes from "./routes/v1.js"
import env from "./config/env.js"

class App {
    readonly express: Express

    constructor() {
        this.express = express()
        this.setup()
    }

    private setup() {
        const dashboardCors = cors(dashboardCorsOptions)
        const gatewayCors = cors(gatewayCorsOptions)

        this.express.use((req: Request, res: Response, next: NextFunction) => {
            if (req.path === "/v1" || req.path.startsWith("/v1/")) {
                return gatewayCors(req, res, next)
            }
            return dashboardCors(req, res, next)
        })

        this.express.use(express.json())

        this.express.get("/", (_req, res) => {
            res.json({ message: "AInvoker API" })
        })

        this.express.get("/health", (_req, res) => {
            res.json({ status: "ok" })
        })

        this.express.use("/api/v1", apiV1Routes.router)
        this.express.use("/v1", gatewayRoutes.router)

        if (env.NODE_ENV !== "production") {
            mountSwagger(this.express)
        }

        this.express.use(errorHandler)
    }
}

export default new App()

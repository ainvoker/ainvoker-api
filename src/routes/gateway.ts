import { Router } from "express"
import textRoutes from "../modules/text/routes.js"

class GatewayRoutes {
    readonly router = Router()

    constructor() {
        this.router.use("/text", textRoutes.router)
    }
}

export default new GatewayRoutes()

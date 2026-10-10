import { Router } from "express"
import imageRoutes from "../modules/image/routes.js"
import textRoutes from "../modules/text/routes.js"

class GatewayRoutes {
    readonly router = Router()

    constructor() {
        this.router.use("/text", textRoutes.router)
        this.router.use("/image", imageRoutes.router)
    }
}

export default new GatewayRoutes()

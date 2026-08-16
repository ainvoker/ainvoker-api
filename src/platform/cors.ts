import type { CorsOptions } from "cors"
import env from "../config/env.js"
import { tryNormalizeOrigin } from "../platform/origin.js"
import allowedOriginsService from "../modules/allowedOrigins/service.js"

function dashboardOriginList(): string[] {
    const origins = env.CORS_ORIGIN.split(",")
        .map((part) => part.trim())
        .filter(Boolean)
    return origins.length > 0 ? origins : ["http://localhost:5173"]
}

export const dashboardCorsOptions: CorsOptions = {
    origin(origin, callback) {
        if (!origin) {
            callback(null, true)
            return
        }

        const allowed = dashboardOriginList()
        if (allowed.includes(origin)) {
            callback(null, origin)
            return
        }

        callback(null, false)
    },
}

/** Gateway CORS: reflect Origin only if it is registered on any project. */
export const gatewayCorsOptions: CorsOptions = {
    origin(origin, callback) {
        void (async () => {
            if (!origin) {
                callback(null, true)
                return
            }

            const normalized = tryNormalizeOrigin(origin)
            if (!normalized) {
                callback(null, false)
                return
            }

            try {
                const allowed = await allowedOriginsService.isOriginRegistered(normalized)
                callback(null, allowed ? normalized : false)
            } catch {
                callback(null, false)
            }
        })()
    },
}

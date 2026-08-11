import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1),
    NEON_AUTH_URL: z.string().url(),
    CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
    OPENAI_API_KEY: z.string().min(1).optional(),
    GEMINI_API_KEY: z.string().min(1).optional(),
    BILLING_ENABLED: z
        .enum(["true", "false"])
        .default("false")
        .transform((v) => v === "true"),
    XENDIT_SECRET_KEY: z.string().min(1).optional(),
    XENDIT_WEBHOOK_TOKEN: z.string().min(1).optional(),
    XENDIT_PRO_AMOUNT: z.coerce.number().int().positive().default(109900),
    /**
     * HTTPS origin(s) for Xendit Components (comma-separated).
     * Xendit rejects http:// here. Local SPA may still run on http; use mock SDK or an HTTPS tunnel for real Components.
     */
    XENDIT_COMPONENTS_ORIGIN: z.string().min(1).default("https://localhost:5173"),
})

class EnvConfig {
    readonly NODE_ENV: "development" | "test" | "production"
    readonly PORT: number
    readonly DATABASE_URL: string
    readonly NEON_AUTH_URL: string
    readonly CORS_ORIGIN: string
    readonly OPENAI_API_KEY: string | undefined
    readonly GEMINI_API_KEY: string | undefined
    readonly BILLING_ENABLED: boolean
    readonly XENDIT_SECRET_KEY: string | undefined
    readonly XENDIT_WEBHOOK_TOKEN: string | undefined
    readonly XENDIT_PRO_AMOUNT: number
    readonly XENDIT_COMPONENTS_ORIGIN: string

    constructor() {
        const parsed = envSchema.safeParse(process.env)

        if (!parsed.success) {
            console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors)
            if (process.env.NODE_ENV === "test") {
                throw new Error("Invalid environment variables for tests")
            }
            process.exit(1)
        }

        this.NODE_ENV = parsed.data.NODE_ENV
        this.PORT = parsed.data.PORT
        this.DATABASE_URL = parsed.data.DATABASE_URL
        this.NEON_AUTH_URL = parsed.data.NEON_AUTH_URL
        this.CORS_ORIGIN = parsed.data.CORS_ORIGIN
        this.OPENAI_API_KEY = parsed.data.OPENAI_API_KEY
        this.GEMINI_API_KEY = parsed.data.GEMINI_API_KEY
        this.BILLING_ENABLED = parsed.data.BILLING_ENABLED
        this.XENDIT_SECRET_KEY = parsed.data.XENDIT_SECRET_KEY
        this.XENDIT_WEBHOOK_TOKEN = parsed.data.XENDIT_WEBHOOK_TOKEN
        this.XENDIT_PRO_AMOUNT = parsed.data.XENDIT_PRO_AMOUNT
        this.XENDIT_COMPONENTS_ORIGIN = parsed.data.XENDIT_COMPONENTS_ORIGIN

        if (this.BILLING_ENABLED && !this.XENDIT_SECRET_KEY) {
            console.error("XENDIT_SECRET_KEY is required when BILLING_ENABLED=true")
            if (process.env.NODE_ENV === "test") {
                throw new Error("XENDIT_SECRET_KEY is required when BILLING_ENABLED=true")
            }
            process.exit(1)
        }
    }

    /** Xendit Components requires HTTPS origins (API validation). */
    getXenditComponentsOrigins(): string[] {
        const origins = this.XENDIT_COMPONENTS_ORIGIN.split(",")
            .map((o) => o.trim())
            .filter(Boolean)
            .map((origin) => {
                if (origin.startsWith("https://")) return origin
                if (origin.startsWith("http://")) {
                    return `https://${origin.slice("http://".length)}`
                }
                return `https://${origin}`
            })

        return origins.length > 0 ? origins : ["https://localhost:5173"]
    }

    /** SPA base for default return URLs — prefer real CORS origin (may be http locally). */
    getClientOrigin(): string {
        return this.CORS_ORIGIN.split(",")[0]?.trim() || "http://localhost:5173"
    }
}

export default new EnvConfig()

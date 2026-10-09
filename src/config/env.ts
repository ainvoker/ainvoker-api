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
    /** When true, create/resend emails the accept link and omits it from the JSON response. */
    INVITE_EMAIL_ENABLED: z
        .enum(["true", "false"])
        .default("false")
        .transform((v) => v === "true"),
    /**
     * Dev/test only. When email is off (or send fails), return acceptUrl in the JSON response.
     * Ignored in production. The raw token is never returned.
     */
    INVITE_RETURN_ACCEPT_URL: z
        .enum(["true", "false"])
        .default("false")
        .transform((v) => v === "true"),
    /** Cloudflare API token with Email Sending permission. */
    CLOUDFLARE_API_TOKEN: z.string().min(1).optional(),
    /** Cloudflare account ID (Dashboard → account → Overview). */
    CLOUDFLARE_ACCOUNT_ID: z.string().min(1).optional(),
    /** From address for invite mail, e.g. `AInvoker <invites@yourdomain.com>`. */
    INVITE_EMAIL_FROM: z.string().min(1).optional(),
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
    readonly INVITE_EMAIL_ENABLED: boolean
    readonly INVITE_RETURN_ACCEPT_URL: boolean
    readonly CLOUDFLARE_API_TOKEN: string | undefined
    readonly CLOUDFLARE_ACCOUNT_ID: string | undefined
    readonly INVITE_EMAIL_FROM: string | undefined

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
        this.INVITE_EMAIL_ENABLED = parsed.data.INVITE_EMAIL_ENABLED
        this.INVITE_RETURN_ACCEPT_URL = parsed.data.INVITE_RETURN_ACCEPT_URL
        this.CLOUDFLARE_API_TOKEN = parsed.data.CLOUDFLARE_API_TOKEN
        this.CLOUDFLARE_ACCOUNT_ID = parsed.data.CLOUDFLARE_ACCOUNT_ID
        this.INVITE_EMAIL_FROM = parsed.data.INVITE_EMAIL_FROM

        if (this.BILLING_ENABLED && !this.XENDIT_SECRET_KEY) {
            console.error("XENDIT_SECRET_KEY is required when BILLING_ENABLED=true")
            if (process.env.NODE_ENV === "test") {
                throw new Error("XENDIT_SECRET_KEY is required when BILLING_ENABLED=true")
            }
            process.exit(1)
        }

        if (
            this.INVITE_EMAIL_ENABLED &&
            (!this.CLOUDFLARE_API_TOKEN || !this.CLOUDFLARE_ACCOUNT_ID || !this.INVITE_EMAIL_FROM)
        ) {
            console.error(
                "CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, and INVITE_EMAIL_FROM are required when INVITE_EMAIL_ENABLED=true",
            )
            if (process.env.NODE_ENV === "test") {
                throw new Error(
                    "CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, and INVITE_EMAIL_FROM are required when INVITE_EMAIL_ENABLED=true",
                )
            }
            process.exit(1)
        }

        if (this.NODE_ENV === "production" && this.INVITE_RETURN_ACCEPT_URL) {
            console.error("INVITE_RETURN_ACCEPT_URL cannot be enabled in production")
            process.exit(1)
        }
    }

    /**
     * Local/dev fallback: include acceptUrl on create/resend.
     * Never honored in production, even if the flag is set.
     */
    returnsInviteAcceptUrl(): boolean {
        return this.INVITE_RETURN_ACCEPT_URL && this.NODE_ENV !== "production"
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

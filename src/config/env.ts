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
})

class EnvConfig {
    readonly NODE_ENV: "development" | "test" | "production"
    readonly PORT: number
    readonly DATABASE_URL: string
    readonly NEON_AUTH_URL: string
    readonly CORS_ORIGIN: string
    /** Present when set; adapters must check before calling upstream. */
    readonly OPENAI_API_KEY: string | undefined
    readonly GEMINI_API_KEY: string | undefined

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
    }
}

export default new EnvConfig()

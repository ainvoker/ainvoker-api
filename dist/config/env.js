import "dotenv/config";
import { z } from "zod";
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
});
class EnvConfig {
    NODE_ENV;
    PORT;
    DATABASE_URL;
    NEON_AUTH_URL;
    CORS_ORIGIN;
    OPENAI_API_KEY;
    GEMINI_API_KEY;
    BILLING_ENABLED;
    XENDIT_SECRET_KEY;
    XENDIT_WEBHOOK_TOKEN;
    XENDIT_PRO_AMOUNT;
    constructor() {
        const parsed = envSchema.safeParse(process.env);
        if (!parsed.success) {
            console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
            if (process.env.NODE_ENV === "test") {
                throw new Error("Invalid environment variables for tests");
            }
            process.exit(1);
        }
        this.NODE_ENV = parsed.data.NODE_ENV;
        this.PORT = parsed.data.PORT;
        this.DATABASE_URL = parsed.data.DATABASE_URL;
        this.NEON_AUTH_URL = parsed.data.NEON_AUTH_URL;
        this.CORS_ORIGIN = parsed.data.CORS_ORIGIN;
        this.OPENAI_API_KEY = parsed.data.OPENAI_API_KEY;
        this.GEMINI_API_KEY = parsed.data.GEMINI_API_KEY;
        this.BILLING_ENABLED = parsed.data.BILLING_ENABLED;
        this.XENDIT_SECRET_KEY = parsed.data.XENDIT_SECRET_KEY;
        this.XENDIT_WEBHOOK_TOKEN = parsed.data.XENDIT_WEBHOOK_TOKEN;
        this.XENDIT_PRO_AMOUNT = parsed.data.XENDIT_PRO_AMOUNT;
        if (this.BILLING_ENABLED && !this.XENDIT_SECRET_KEY) {
            console.error("XENDIT_SECRET_KEY is required when BILLING_ENABLED=true");
            if (process.env.NODE_ENV === "test") {
                throw new Error("XENDIT_SECRET_KEY is required when BILLING_ENABLED=true");
            }
            process.exit(1);
        }
    }
}
export default new EnvConfig();
//# sourceMappingURL=env.js.map
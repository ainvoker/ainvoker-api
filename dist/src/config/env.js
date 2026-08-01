import "dotenv/config";
import { z } from "zod";
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1),
    NEON_AUTH_URL: z.string().url(),
    CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    process.exit(1);
}
export const env = parsed.data;
//# sourceMappingURL=env.js.map
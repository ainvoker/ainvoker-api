import { config } from "dotenv"
import { resolve } from "node:path"

// Prefer .env.test over any previously loaded .env (e.g. prisma/dotenv/config).
config({ path: resolve(process.cwd(), ".env.test"), override: true })
process.env.NODE_ENV = "test"

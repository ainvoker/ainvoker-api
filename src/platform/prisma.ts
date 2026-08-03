import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../../generated/prisma/client.js"
import env from "../config/env.js"

class PrismaService {
    readonly client: PrismaClient

    constructor() {
        const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })
        this.client = new PrismaClient({ adapter })
    }
}

export default new PrismaService().client

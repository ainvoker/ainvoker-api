import { Prisma } from "../../../generated/prisma/client.js"
import prismaClient from "../../platform/prisma.js"

const OPENAI_PROVIDER = "openai"
const DEFAULT_MODEL = "gpt-4o-mini"

let ensurePromise: Promise<void> | null = null

/**
 * Idempotent seed for the MVP text catalog (openai / gpt-4o-mini).
 * Safe to call on every chat request; runs the upsert work at most once per process.
 */
export async function ensureTextCatalog(): Promise<void> {
    if (!ensurePromise) {
        ensurePromise = seedTextCatalog().catch((err) => {
            ensurePromise = null
            throw err
        })
    }
    await ensurePromise
}

async function seedTextCatalog(): Promise<void> {
    const provider = await prismaClient.aIProvider.upsert({
        where: { name: OPENAI_PROVIDER },
        create: {
            name: OPENAI_PROVIDER,
            baseUrl: "https://api.openai.com/v1",
            documentation: "https://platform.openai.com/docs",
            status: "ACTIVE",
        },
        update: {
            baseUrl: "https://api.openai.com/v1",
            status: "ACTIVE",
        },
    })

    await prismaClient.aIModel.upsert({
        where: {
            providerId_name: {
                providerId: provider.id,
                name: DEFAULT_MODEL,
            },
        },
        create: {
            providerId: provider.id,
            name: DEFAULT_MODEL,
            type: "TEXT",
            contextWindow: 128000,
            inputPrice: new Prisma.Decimal("0.000150"),
            outputPrice: new Prisma.Decimal("0.000600"),
            status: "ACTIVE",
        },
        update: {
            type: "TEXT",
            status: "ACTIVE",
            contextWindow: 128000,
        },
    })
}

export const textCatalogDefaults = {
    providerName: OPENAI_PROVIDER,
    modelName: DEFAULT_MODEL,
    modelSlug: `${OPENAI_PROVIDER}/${DEFAULT_MODEL}`,
} as const

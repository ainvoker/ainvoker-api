import { Prisma } from "../../generated/prisma/client.js"
import type { AIModelType } from "../../generated/prisma/client.js"
import prismaClient from "../../platform/prisma.js"

/**
 * Bootstrap data for `npm run prisma:seed` and tests. Never called on the request path.
 *
 * Providers are developer-owned: add one here together with its adapter in
 * src/providers/index.ts and its API key in config/env.ts.
 *
 * Models are admin-owned: after the first seed, add or retire them through
 * /api/v1/admin/models. Existing model rows are never overwritten, so re-seeding
 * keeps admin edits (status, prices, freeEligible).
 */
const PROVIDER_SEEDS = [
    {
        name: "openai",
        baseUrl: "https://api.openai.com/v1",
        documentation: "https://platform.openai.com/docs",
    },
    {
        name: "gemini",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta",
        documentation: "https://ai.google.dev/gemini-api/docs",
    },
] as const

type ModelSeed = {
    provider: (typeof PROVIDER_SEEDS)[number]["name"]
    name: string
    type: AIModelType
    contextWindow: number
    /** USD per 1M tokens. */
    inputPrice: string
    outputPrice: string
    freeEligible: boolean
}

const MODEL_SEEDS: ModelSeed[] = [
    {
        provider: "openai",
        name: "gpt-4o-mini",
        type: "TEXT",
        contextWindow: 128000,
        inputPrice: "0.000150",
        outputPrice: "0.000600",
        freeEligible: true,
    },
    {
        provider: "gemini",
        name: "gemini-3.6-flash",
        type: "TEXT",
        contextWindow: 1048576,
        inputPrice: "0",
        outputPrice: "0",
        freeEligible: true,
    },
    {
        provider: "gemini",
        name: "gemini-3.5-flash-lite",
        type: "TEXT",
        contextWindow: 1048576,
        inputPrice: "0",
        outputPrice: "0",
        freeEligible: true,
    },
    {
        provider: "openai",
        name: "gpt-image-2.5-flare",
        type: "IMAGE",
        contextWindow: 32000,
        inputPrice: "5",
        outputPrice: "30",
        freeEligible: false,
    },
]

let ensurePromise: Promise<void> | null = null

/** Idempotent; runs the seed at most once per process. */
export async function ensureAiCatalog(): Promise<void> {
    if (!ensurePromise) {
        ensurePromise = seedAiCatalog().catch((err) => {
            ensurePromise = null
            throw err
        })
    }
    await ensurePromise
}

async function seedAiCatalog(): Promise<void> {
    const providerIds = new Map<string, number>()
    for (const seed of PROVIDER_SEEDS) {
        const provider = await prismaClient.aIProvider.upsert({
            where: { name: seed.name },
            create: { ...seed, status: "ACTIVE" },
            update: { baseUrl: seed.baseUrl, documentation: seed.documentation },
        })
        providerIds.set(seed.name, provider.id)
    }

    for (const seed of MODEL_SEEDS) {
        const providerId = providerIds.get(seed.provider)!
        await prismaClient.aIModel.upsert({
            where: { providerId_name: { providerId, name: seed.name } },
            create: {
                providerId,
                name: seed.name,
                type: seed.type,
                contextWindow: seed.contextWindow,
                inputPrice: new Prisma.Decimal(seed.inputPrice),
                outputPrice: new Prisma.Decimal(seed.outputPrice),
                status: "ACTIVE",
                freeEligible: seed.freeEligible,
            },
            update: {},
        })
    }
}

export const textCatalogDefaults = {
    providerName: "openai",
    modelName: "gpt-4o-mini",
    modelSlug: "openai/gpt-4o-mini",
    geminiModelSlug: "gemini/gemini-3.6-flash",
    geminiLiteModelSlug: "gemini/gemini-3.5-flash-lite",
} as const

export const imageCatalogDefaults = {
    providerName: "openai",
    modelName: "gpt-image-2.5-flare",
    modelSlug: "openai/gpt-image-2.5-flare",
} as const

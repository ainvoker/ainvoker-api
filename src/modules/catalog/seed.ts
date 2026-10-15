import { Prisma } from "../../generated/prisma/client.js"
import type { AIModelType, ModelPlanTier } from "../../generated/prisma/client.js"
import { recomputeAllModelRetailPrices } from "../business/retail.js"
import prismaClient from "../../platform/prisma.js"

/**
 * Bootstrap data for `npm run prisma:seed` and migrations. Never called on the request path.
 * Models are defined in code; admin may change status, planTier, and freeEligible,
 * so re-seeding only refreshes vendor facts (type, context window, provider prices).
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
    /** Provider USD per 1M tokens (Standard tier; image models use the image output rate). */
    providerInputPrice: string
    providerOutputPrice: string
    /** ECONOMY: standard markup. PREMIUM: higher markup, never on Free. Initial value; admin owns it after insert. */
    planTier: ModelPlanTier
    /** Economy models offered on Free. Initial value; admin owns it after insert. */
    freeEligible: boolean
}

const MODEL_SEEDS: ModelSeed[] = [
    // OpenAI text
    {
        provider: "openai",
        name: "gpt-4o-mini",
        type: "TEXT",
        contextWindow: 128000,
        providerInputPrice: "0.15",
        providerOutputPrice: "0.60",
        planTier: "ECONOMY",
        freeEligible: true,
    },
    {
        provider: "openai",
        name: "gpt-6-luna",
        type: "TEXT",
        contextWindow: 1050000,
        providerInputPrice: "0.10",
        providerOutputPrice: "0.50",
        planTier: "ECONOMY",
        freeEligible: false,
    },
    {
        provider: "openai",
        name: "gpt-6.1-sol",
        type: "TEXT",
        contextWindow: 1050000,
        providerInputPrice: "2",
        providerOutputPrice: "10",
        planTier: "PREMIUM",
        freeEligible: false,
    },
    {
        provider: "openai",
        name: "gpt-6-astra",
        type: "TEXT",
        contextWindow: 1050000,
        providerInputPrice: "10",
        providerOutputPrice: "50",
        planTier: "PREMIUM",
        freeEligible: false,
    },
    // Gemini text
    {
        provider: "gemini",
        name: "gemini-3.5-flash-lite",
        type: "TEXT",
        contextWindow: 1048576,
        providerInputPrice: "0.30",
        providerOutputPrice: "2.50",
        planTier: "ECONOMY",
        freeEligible: true,
    },
    {
        provider: "gemini",
        name: "gemini-3.6-flash",
        type: "TEXT",
        contextWindow: 1048576,
        providerInputPrice: "0.75",
        providerOutputPrice: "3.75",
        planTier: "ECONOMY",
        freeEligible: true,
    },
    {
        provider: "gemini",
        name: "gemini-3.8-flash",
        type: "TEXT",
        contextWindow: 1048576,
        providerInputPrice: "0.75",
        providerOutputPrice: "3.75",
        planTier: "ECONOMY",
        freeEligible: true,
    },
    {
        provider: "gemini",
        name: "gemini-3.1-pro-preview",
        type: "TEXT",
        contextWindow: 1048576,
        providerInputPrice: "2",
        providerOutputPrice: "12",
        planTier: "PREMIUM",
        freeEligible: false,
    },
    {
        provider: "gemini",
        name: "gemini-4-argon",
        type: "TEXT",
        contextWindow: 1048576,
        providerInputPrice: "2",
        providerOutputPrice: "10",
        planTier: "PREMIUM",
        freeEligible: false,
    },
    // Images are always PREMIUM (never on Free)
    {
        provider: "openai",
        name: "gpt-image-2.5-flare",
        type: "IMAGE",
        contextWindow: 32000,
        providerInputPrice: "5",
        providerOutputPrice: "30",
        planTier: "PREMIUM",
        freeEligible: false,
    },
    {
        provider: "openai",
        name: "gpt-image-2.5-sunburst",
        type: "IMAGE",
        contextWindow: 32000,
        providerInputPrice: "5",
        providerOutputPrice: "30",
        planTier: "PREMIUM",
        freeEligible: false,
    },
    {
        provider: "gemini",
        name: "gemini-3.1-flash-lite-image",
        type: "IMAGE",
        contextWindow: 32000,
        providerInputPrice: "0.25",
        providerOutputPrice: "30",
        planTier: "PREMIUM",
        freeEligible: false,
    },
    {
        provider: "gemini",
        name: "gemini-nano-banana-2.1",
        type: "IMAGE",
        contextWindow: 32000,
        providerInputPrice: "1.50",
        providerOutputPrice: "30",
        planTier: "PREMIUM",
        freeEligible: false,
    },
    {
        provider: "gemini",
        name: "gemini-3-pro-image",
        type: "IMAGE",
        contextWindow: 32000,
        providerInputPrice: "2",
        providerOutputPrice: "120",
        planTier: "PREMIUM",
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
        const providerIn = new Prisma.Decimal(seed.providerInputPrice)
        const providerOut = new Prisma.Decimal(seed.providerOutputPrice)
        await prismaClient.aIModel.upsert({
            where: { providerId_name: { providerId, name: seed.name } },
            create: {
                providerId,
                name: seed.name,
                type: seed.type,
                contextWindow: seed.contextWindow,
                providerInputPrice: providerIn,
                providerOutputPrice: providerOut,
                inputPrice: providerIn,
                outputPrice: providerOut,
                status: "ACTIVE",
                planTier: seed.planTier,
                freeEligible: seed.planTier === "ECONOMY" && seed.freeEligible,
            },
            update: {
                type: seed.type,
                contextWindow: seed.contextWindow,
                providerInputPrice: providerIn,
                providerOutputPrice: providerOut,
            },
        })
    }

    await recomputeAllModelRetailPrices()
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

import { Prisma } from "../../generated/prisma/client.js"
import prismaClient from "../../platform/prisma.js"

const OPENAI_PROVIDER = "openai"
const OPENAI_MODEL = "gpt-4o-mini"
const GEMINI_PROVIDER = "gemini"
const GEMINI_MODEL = "gemini-3.6-flash"
const GEMINI_LITE_MODEL = "gemini-3.5-flash-lite"

let ensurePromise: Promise<void> | null = null

/**
 * Idempotent seed for the MVP text catalog (openai + gemini Flash and Flash-Lite).
 * Safe to call on every chat request; runs the upsert work at most once per process.
 *
 * Adding a later model (no Prisma migration):
 * 1. Upsert the AIModel (name, context window, prices, freeEligible). Deploy runs this seed on chat.
 * 2. Reuse the OpenAI or Gemini adapter if it can pass the id through. Add a ChatProvider,
 *    provider row, and env API key only for a new provider, or a branch only if the request
 *    body differs (for example max_completion_tokens).
 * 3. Add the id to the SDK union and to ainvoker_client/src/pages/docs/Models.tsx.
 * 4. Pro/Scale call returns 200. Free returns 200 only when freeEligible, otherwise 403.
 *    Unknown slug returns 404.
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
    const openai = await prismaClient.aIProvider.upsert({
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
                providerId: openai.id,
                name: OPENAI_MODEL,
            },
        },
        create: {
            providerId: openai.id,
            name: OPENAI_MODEL,
            type: "TEXT",
            contextWindow: 128000,
            inputPrice: new Prisma.Decimal("0.000150"),
            outputPrice: new Prisma.Decimal("0.000600"),
            status: "ACTIVE",
            freeEligible: true,
        },
        update: {
            type: "TEXT",
            status: "ACTIVE",
            contextWindow: 128000,
            freeEligible: true,
        },
    })

    const gemini = await prismaClient.aIProvider.upsert({
        where: { name: GEMINI_PROVIDER },
        create: {
            name: GEMINI_PROVIDER,
            baseUrl: "https://generativelanguage.googleapis.com/v1beta",
            documentation: "https://ai.google.dev/gemini-api/docs",
            status: "ACTIVE",
        },
        update: {
            baseUrl: "https://generativelanguage.googleapis.com/v1beta",
            status: "ACTIVE",
        },
    })

    for (const name of [GEMINI_MODEL, GEMINI_LITE_MODEL]) {
        await prismaClient.aIModel.upsert({
            where: {
                providerId_name: {
                    providerId: gemini.id,
                    name,
                },
            },
            create: {
                providerId: gemini.id,
                name,
                type: "TEXT",
                contextWindow: 1048576,
                inputPrice: new Prisma.Decimal("0"),
                outputPrice: new Prisma.Decimal("0"),
                status: "ACTIVE",
                freeEligible: true,
            },
            update: {
                type: "TEXT",
                status: "ACTIVE",
                contextWindow: 1048576,
                inputPrice: new Prisma.Decimal("0"),
                outputPrice: new Prisma.Decimal("0"),
                freeEligible: true,
            },
        })
    }
}

export const textCatalogDefaults = {
    providerName: OPENAI_PROVIDER,
    modelName: OPENAI_MODEL,
    modelSlug: `${OPENAI_PROVIDER}/${OPENAI_MODEL}`,
    geminiModelSlug: `${GEMINI_PROVIDER}/${GEMINI_MODEL}`,
    geminiLiteModelSlug: `${GEMINI_PROVIDER}/${GEMINI_LITE_MODEL}`,
} as const

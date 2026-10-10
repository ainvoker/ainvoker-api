import { Prisma } from "../../generated/prisma/client.js"
import prismaClient from "../../platform/prisma.js"
import { ensureTextCatalog } from "../text/catalog.js"

const OPENAI_PROVIDER = "openai"
const OPENAI_IMAGE_MODEL = "gpt-image-2.5-flare"

let ensurePromise: Promise<void> | null = null

/**
 * Idempotent seed for the image catalog. Reuses the provider rows from the text seed.
 * Prices are USD per 1M tokens (text prompt in, image tokens out), same as text models.
 * Image models are never freeEligible: no upstream provider offers free image output.
 */
export async function ensureImageCatalog(): Promise<void> {
    if (!ensurePromise) {
        ensurePromise = seedImageCatalog().catch((err) => {
            ensurePromise = null
            throw err
        })
    }
    await ensurePromise
}

async function seedImageCatalog(): Promise<void> {
    await ensureTextCatalog()

    const openai = await prismaClient.aIProvider.findUniqueOrThrow({
        where: { name: OPENAI_PROVIDER },
    })

    await prismaClient.aIModel.upsert({
        where: {
            providerId_name: {
                providerId: openai.id,
                name: OPENAI_IMAGE_MODEL,
            },
        },
        create: {
            providerId: openai.id,
            name: OPENAI_IMAGE_MODEL,
            type: "IMAGE",
            contextWindow: 32000,
            inputPrice: new Prisma.Decimal("5"),
            outputPrice: new Prisma.Decimal("30"),
            status: "ACTIVE",
            freeEligible: false,
        },
        update: {
            type: "IMAGE",
            status: "ACTIVE",
            contextWindow: 32000,
            inputPrice: new Prisma.Decimal("5"),
            outputPrice: new Prisma.Decimal("30"),
            freeEligible: false,
        },
    })
}

export const imageCatalogDefaults = {
    providerName: OPENAI_PROVIDER,
    modelName: OPENAI_IMAGE_MODEL,
    modelSlug: `${OPENAI_PROVIDER}/${OPENAI_IMAGE_MODEL}`,
} as const

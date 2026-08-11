import { Prisma } from "../../../generated/prisma/client.js";
import prismaClient from "../../platform/prisma.js";
const OPENAI_PROVIDER = "openai";
const OPENAI_MODEL = "gpt-4o-mini";
const GEMINI_PROVIDER = "gemini";
const GEMINI_MODEL = "gemini-3.6-flash";
let ensurePromise = null;
/**
 * Idempotent seed for the MVP text catalog (openai + gemini Flash).
 * Safe to call on every chat request; runs the upsert work at most once per process.
 */
export async function ensureTextCatalog() {
    if (!ensurePromise) {
        ensurePromise = seedTextCatalog().catch((err) => {
            ensurePromise = null;
            throw err;
        });
    }
    await ensurePromise;
}
async function seedTextCatalog() {
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
    });
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
    });
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
    });
    await prismaClient.aIModel.upsert({
        where: {
            providerId_name: {
                providerId: gemini.id,
                name: GEMINI_MODEL,
            },
        },
        create: {
            providerId: gemini.id,
            name: GEMINI_MODEL,
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
    });
}
export const textCatalogDefaults = {
    providerName: OPENAI_PROVIDER,
    modelName: OPENAI_MODEL,
    modelSlug: `${OPENAI_PROVIDER}/${OPENAI_MODEL}`,
    geminiModelSlug: `${GEMINI_PROVIDER}/${GEMINI_MODEL}`,
};
//# sourceMappingURL=catalog.js.map
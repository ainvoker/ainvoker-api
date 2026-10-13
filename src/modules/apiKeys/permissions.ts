import { z } from "zod"
import type { Prisma } from "../../generated/prisma/client.js"
import { AppError } from "../../platform/errors.js"

/** Add a category or feature here; the dashboard mirrors this in `ainvoker_client/src/utils/apiKeyCapabilities.ts`. */
const API_KEY_PERMISSION_CATALOG = {
    text: ["chat", "stream"],
    image: ["generate"],
} as const

type Catalog = typeof API_KEY_PERMISSION_CATALOG

export type ApiKeyCategory = keyof Catalog

export type ApiKeyFeature = {
    [C in ApiKeyCategory]: `${C}.${Catalog[C][number]}`
}[ApiKeyCategory]

/** A category grants every feature in it, including features added later. */
export type ApiKeyScope = ApiKeyCategory | ApiKeyFeature

const API_KEY_CATEGORIES = Object.keys(API_KEY_PERMISSION_CATALOG) as ApiKeyCategory[]

const featuresOf = (category: ApiKeyCategory) =>
    API_KEY_PERMISSION_CATALOG[category].map((feature) => `${category}.${feature}` as ApiKeyFeature)

export const API_KEY_SCOPES = [
    ...API_KEY_CATEGORIES,
    ...API_KEY_CATEGORIES.flatMap(featuresOf),
] as [ApiKeyScope, ...ApiKeyScope[]]

export const apiKeyPermissionsSchema = z.object({
    scopes: z.array(z.enum(API_KEY_SCOPES)).min(1, "Select at least one permission"),
})

export type ApiKeyPermissions = z.infer<typeof apiKeyPermissionsSchema>

/** Dedupes, folds fully selected categories into the category, and keeps catalog order. */
export function normalizeApiKeyPermissions(permissions: ApiKeyPermissions): ApiKeyPermissions {
    const selected = new Set(permissions.scopes)
    const scopes: ApiKeyScope[] = []
    for (const category of API_KEY_CATEGORIES) {
        const features = featuresOf(category)
        if (selected.has(category) || features.every((feature) => selected.has(feature))) {
            scopes.push(category)
        } else {
            scopes.push(...features.filter((feature) => selected.has(feature)))
        }
    }
    return { scopes }
}

/** `null` means unrestricted (keys created before scopes existed). Malformed JSON grants nothing. */
export function hasApiKeyFeature(
    permissions: Prisma.JsonValue | null,
    feature: ApiKeyFeature,
): boolean {
    if (permissions === null) {
        return true
    }
    const parsed = apiKeyPermissionsSchema.safeParse(permissions)
    if (!parsed.success) {
        return false
    }
    const category = feature.split(".")[0] as ApiKeyCategory
    return parsed.data.scopes.some((scope) => scope === feature || scope === category)
}

export function assertApiKeyFeature(permissions: Prisma.JsonValue | null, feature: ApiKeyFeature) {
    if (!hasApiKeyFeature(permissions, feature)) {
        throw new AppError(
            403,
            "API_KEY_SCOPE_DENIED",
            `This API key does not have the "${feature}" permission`,
        )
    }
}

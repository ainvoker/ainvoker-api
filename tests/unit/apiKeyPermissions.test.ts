import { describe, expect, it } from "vitest"
import {
    assertApiKeyFeature,
    hasApiKeyFeature,
    normalizeApiKeyPermissions,
} from "../../src/modules/apiKeys/permissions.js"

describe("hasApiKeyFeature", () => {
    it("treats null as unrestricted", () => {
        expect(hasApiKeyFeature(null, "text.chat")).toBe(true)
        expect(hasApiKeyFeature(null, "image.generate")).toBe(true)
    })

    it("grants every feature in a granted category", () => {
        expect(hasApiKeyFeature({ scopes: ["text"] }, "text.stream")).toBe(true)
        expect(hasApiKeyFeature({ scopes: ["text"] }, "image.generate")).toBe(false)
    })

    it("grants only the listed feature", () => {
        expect(hasApiKeyFeature({ scopes: ["text.chat"] }, "text.chat")).toBe(true)
        expect(hasApiKeyFeature({ scopes: ["text.chat"] }, "text.stream")).toBe(false)
    })

    it("grants nothing for malformed JSON", () => {
        expect(hasApiKeyFeature({ scopes: "text" }, "text.chat")).toBe(false)
    })
})

describe("normalizeApiKeyPermissions", () => {
    it("folds a fully selected category and keeps catalog order", () => {
        expect(
            normalizeApiKeyPermissions({ scopes: ["image.generate", "text.stream", "text.chat"] }),
        ).toEqual({ scopes: ["text", "image"] })
    })

    it("drops features already covered by their category", () => {
        expect(normalizeApiKeyPermissions({ scopes: ["text.chat", "text"] })).toEqual({
            scopes: ["text"],
        })
    })

    it("keeps a partial category as features", () => {
        expect(normalizeApiKeyPermissions({ scopes: ["text.stream", "text.stream"] })).toEqual({
            scopes: ["text.stream"],
        })
    })
})

describe("assertApiKeyFeature", () => {
    it("throws API_KEY_SCOPE_DENIED when the feature is missing", () => {
        expect(() => assertApiKeyFeature({ scopes: ["text"] }, "image.generate")).toThrow(
            expect.objectContaining({ status: 403, code: "API_KEY_SCOPE_DENIED" }),
        )
    })
})

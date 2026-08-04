import { describe, expect, it } from "vitest"
import { parseModelSlug, textChatSchema } from "../../src/modules/text/schemas.js"
import chatProviderRegistry from "../../src/providers/registry.js"
import { AppError } from "../../src/platform/errors.js"

describe("textChatSchema", () => {
    it("accepts a valid provider/model body", () => {
        const parsed = textChatSchema.parse({
            model: "openai/gpt-4o-mini",
            messages: [{ role: "user", content: "Hello" }],
        })
        expect(parsed.model).toBe("openai/gpt-4o-mini")
        expect(parsed.messages).toHaveLength(1)
    })

    it("rejects model without provider slash", () => {
        expect(() =>
            textChatSchema.parse({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: "Hi" }],
            }),
        ).toThrow()
    })

    it("rejects empty messages", () => {
        expect(() =>
            textChatSchema.parse({
                model: "openai/gpt-4o-mini",
                messages: [],
            }),
        ).toThrow()
    })
})

describe("parseModelSlug", () => {
    it("splits provider and model", () => {
        expect(parseModelSlug("openai/gpt-4o-mini")).toEqual({
            providerName: "openai",
            modelName: "gpt-4o-mini",
        })
    })
})

describe("chatProviderRegistry", () => {
    it("throws PROVIDER_NOT_IMPLEMENTED for unknown providers", () => {
        expect(() => chatProviderRegistry.get("not-a-real-provider")).toThrow(AppError)
        try {
            chatProviderRegistry.get("not-a-real-provider")
        } catch (err) {
            expect(err).toBeInstanceOf(AppError)
            expect((err as AppError).code).toBe("PROVIDER_NOT_IMPLEMENTED")
            expect((err as AppError).status).toBe(501)
        }
    })
})

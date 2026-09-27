import { describe, expect, it } from "vitest"
import { isModelSlug, parseModelSlug, textChatSchema } from "../../src/modules/text/schemas.js"
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

    it("accepts a bare model name", () => {
        const parsed = textChatSchema.parse({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "Hi" }],
        })
        expect(parsed.model).toBe("gpt-4o-mini")
    })

    it("accepts each reasoning level", () => {
        for (const reasoning of ["minimal", "low", "medium", "high"] as const) {
            const parsed = textChatSchema.parse({
                model: "gemini/gemini-3.6-flash",
                messages: [{ role: "user", content: "Hi" }],
                reasoning,
            })
            expect(parsed.reasoning).toBe(reasoning)
        }
    })

    it("rejects an unknown reasoning level", () => {
        expect(() =>
            textChatSchema.parse({
                model: "gemini/gemini-3.6-flash",
                messages: [{ role: "user", content: "Hi" }],
                reasoning: "extreme",
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

describe("isModelSlug", () => {
    it("detects slugs vs bare names", () => {
        expect(isModelSlug("openai/gpt-4o-mini")).toBe(true)
        expect(isModelSlug("gpt-4o-mini")).toBe(false)
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

    it("has openai and gemini registered after providers/index import", async () => {
        await import("../../src/providers/index.js")
        expect(chatProviderRegistry.has("openai")).toBe(true)
        expect(chatProviderRegistry.has("gemini")).toBe(true)
    })
})

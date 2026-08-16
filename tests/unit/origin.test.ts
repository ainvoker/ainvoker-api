import { describe, expect, it } from "vitest"
import { AppError } from "../../src/platform/errors.js"
import { normalizeOrigin, tryNormalizeOrigin } from "../../src/platform/origin.js"

describe("normalizeOrigin", () => {
    it("accepts https origins and strips trailing slash", () => {
        expect(normalizeOrigin("https://app.example.com/")).toBe("https://app.example.com")
        expect(normalizeOrigin(" https://app.example.com:8443 ")).toBe(
            "https://app.example.com:8443",
        )
    })

    it("allows http only for localhost and 127.0.0.1", () => {
        expect(normalizeOrigin("http://localhost:5173")).toBe("http://localhost:5173")
        expect(normalizeOrigin("http://127.0.0.1:3000")).toBe("http://127.0.0.1:3000")
    })

    it("rejects wildcard", () => {
        expect(() => normalizeOrigin("*")).toThrow(AppError)
        try {
            normalizeOrigin("*")
        } catch (err) {
            expect(err).toBeInstanceOf(AppError)
            expect((err as AppError).code).toBe("VALIDATION_ERROR")
        }
    })

    it("rejects paths, query, and hash", () => {
        expect(() => normalizeOrigin("https://app.example.com/dashboard")).toThrow(AppError)
        expect(() => normalizeOrigin("https://app.example.com?x=1")).toThrow(AppError)
        expect(() => normalizeOrigin("https://app.example.com#frag")).toThrow(AppError)
    })

    it("rejects http for non-localhost hosts", () => {
        expect(() => normalizeOrigin("http://app.example.com")).toThrow(AppError)
    })

    it("tryNormalizeOrigin returns null for invalid input", () => {
        expect(tryNormalizeOrigin(undefined)).toBeNull()
        expect(tryNormalizeOrigin("")).toBeNull()
        expect(tryNormalizeOrigin("not-a-url")).toBeNull()
        expect(tryNormalizeOrigin("https://ok.example.com")).toBe("https://ok.example.com")
    })
})

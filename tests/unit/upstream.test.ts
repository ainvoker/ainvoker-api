import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fetchProvider, providerHttpError } from "../../src/providers/upstream.js"

function jsonResponse(status: number, body: unknown = {}): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    })
}

describe("fetchProvider", () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        vi.useFakeTimers()
        fetchSpy = vi.spyOn(globalThis, "fetch")
    })

    afterEach(() => {
        fetchSpy.mockRestore()
        vi.useRealTimers()
    })

    async function call() {
        const pending = fetchProvider("Gemini", "https://provider.test", { method: "POST" })
        await vi.runAllTimersAsync()
        return pending
    }

    it("retries once when the provider is overloaded", async () => {
        fetchSpy
            .mockResolvedValueOnce(jsonResponse(503, { error: { message: "high demand" } }))
            .mockResolvedValueOnce(jsonResponse(200, { ok: true }))

        const response = await call()

        expect(response.status).toBe(200)
        expect(fetchSpy).toHaveBeenCalledTimes(2)
    })

    it("returns the second failure without retrying again", async () => {
        fetchSpy
            .mockResolvedValueOnce(jsonResponse(503))
            .mockResolvedValueOnce(jsonResponse(429))

        const response = await call()

        expect(response.status).toBe(429)
        expect(fetchSpy).toHaveBeenCalledTimes(2)
    })

    it("does not retry client errors", async () => {
        fetchSpy.mockResolvedValueOnce(jsonResponse(400))

        const response = await call()

        expect(response.status).toBe(400)
        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it("retries a network failure, then reports PROVIDER_UNAVAILABLE", async () => {
        fetchSpy.mockRejectedValue(new TypeError("fetch failed"))

        const assertion = expect(
            fetchProvider("Gemini", "https://provider.test", { method: "POST" }),
        ).rejects.toMatchObject({ status: 503, code: "PROVIDER_UNAVAILABLE" })
        await vi.runAllTimersAsync()
        await assertion
        expect(fetchSpy).toHaveBeenCalledTimes(2)
    })

    it("does not retry after the client disconnects", async () => {
        const controller = new AbortController()
        controller.abort()
        fetchSpy.mockRejectedValue(new DOMException("aborted", "AbortError"))

        await expect(
            fetchProvider("Gemini", "https://provider.test", { signal: controller.signal }),
        ).rejects.toMatchObject({ status: 499, code: "CLIENT_CLOSED" })
        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })
})

describe("providerHttpError", () => {
    it("maps overload and outage statuses to 503 PROVIDER_UNAVAILABLE", () => {
        for (const status of [429, 500, 502, 503, 504]) {
            expect(providerHttpError("Gemini", status, "busy")).toMatchObject({
                status: 503,
                code: "PROVIDER_UNAVAILABLE",
                message: "busy",
            })
        }
    })

    it("maps other provider errors to 400 UPSTREAM_ERROR", () => {
        expect(providerHttpError("OpenAI", 400)).toMatchObject({
            status: 400,
            code: "UPSTREAM_ERROR",
            message: "OpenAI request failed (400)",
        })
    })
})

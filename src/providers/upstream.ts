import { AppError } from "../platform/errors.js"

const RETRY_DELAY_MS = 1000
const MAX_RETRY_DELAY_MS = 3000

/** Provider overload or outage: worth one more try, and reported to callers as 503. */
function isTransientStatus(status: number): boolean {
    return status === 429 || status >= 500
}

function retryDelayMs(response?: Response): number {
    const seconds = Number(response?.headers.get("retry-after"))
    if (Number.isFinite(seconds) && seconds > 0) {
        return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS)
    }
    return RETRY_DELAY_MS
}

function clientClosed(): AppError {
    return new AppError(499, "CLIENT_CLOSED", "Client disconnected")
}

async function wait(ms: number, signal: AbortSignal | undefined): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms))
    if (signal?.aborted) {
        throw clientClosed()
    }
}

/**
 * Calls a provider, retrying once when it is overloaded or unreachable.
 * Returns the final response; callers turn non-2xx into {@link providerHttpError}.
 */
export async function fetchProvider(
    provider: string,
    url: string,
    init: RequestInit,
): Promise<Response> {
    const signal = init.signal ?? undefined
    for (let attempt = 0; ; attempt++) {
        const canRetry = attempt === 0

        let response: Response
        try {
            response = await fetch(url, init)
        } catch (err) {
            if (signal?.aborted) {
                throw clientClosed()
            }
            if (canRetry) {
                await wait(RETRY_DELAY_MS, signal)
                continue
            }
            const reason = err instanceof Error ? err.message : "request failed"
            throw new AppError(503, "PROVIDER_UNAVAILABLE", `${provider} is unreachable: ${reason}`)
        }

        if (canRetry && isTransientStatus(response.status)) {
            await response.body?.cancel().catch(() => {})
            await wait(retryDelayMs(response), signal)
            continue
        }

        return response
    }
}

/**
 * Transient failures are 503, not 502: Cloudflare swaps origin 502/504 responses for
 * its own page, which drops CORS headers, so browsers only see "Failed to fetch".
 */
export function providerHttpError(provider: string, status: number, message?: string): AppError {
    const text = message ?? `${provider} request failed (${status})`
    if (isTransientStatus(status)) {
        return new AppError(503, "PROVIDER_UNAVAILABLE", text)
    }
    return new AppError(400, "UPSTREAM_ERROR", text)
}

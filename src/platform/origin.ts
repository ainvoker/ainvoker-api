import { AppError } from "./errors.js"

export const MAX_ALLOWED_ORIGINS_PER_PROJECT = 20

const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1"])

/**
 * Normalize a user-supplied or request Origin into `protocol://host[:port]`.
 * Rejects wildcards, paths, query/hash, credentials, and non-localhost http.
 */
export function normalizeOrigin(input: string): string {
    const trimmed = input.trim()
    if (!trimmed) {
        throw new AppError(400, "VALIDATION_ERROR", "Origin is required")
    }

    if (trimmed === "*") {
        throw new AppError(400, "VALIDATION_ERROR", "Wildcard origins are not allowed")
    }

    let url: URL
    try {
        url = new URL(trimmed)
    } catch {
        throw new AppError(400, "VALIDATION_ERROR", "Invalid origin URL")
    }

    if (url.username || url.password) {
        throw new AppError(400, "VALIDATION_ERROR", "Origin must not include credentials")
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new AppError(400, "VALIDATION_ERROR", "Origin must use http or https")
    }

    const pathname = url.pathname === "" ? "/" : url.pathname
    if (pathname !== "/" || url.search || url.hash) {
        throw new AppError(
            400,
            "VALIDATION_ERROR",
            "Origin must be scheme + host (+ port only); no path, query, or hash",
        )
    }

    const hostname = url.hostname.toLowerCase()
    const isLocalhost = LOCALHOST_HOSTS.has(hostname)
    if (url.protocol === "http:" && !isLocalhost) {
        throw new AppError(
            400,
            "VALIDATION_ERROR",
            "HTTP origins are only allowed for localhost or 127.0.0.1",
        )
    }

    return url.origin
}

/** Soft parse for CORS callbacks — returns null instead of throwing. */
export function tryNormalizeOrigin(input: string | undefined): string | null {
    if (!input?.trim()) return null
    try {
        return normalizeOrigin(input)
    } catch {
        return null
    }
}

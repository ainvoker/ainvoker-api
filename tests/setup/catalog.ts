import { beforeAll } from "vitest"
import { ensureAiCatalog } from "../../src/modules/catalog/seed.js"

/**
 * The gateway no longer seeds the catalog on requests, so integration tests
 * bootstrap providers and models once per file. Soft-fails so unit tests
 * without a reachable DB still run.
 */
beforeAll(async () => {
    try {
        await ensureAiCatalog()
    } catch (err) {
        console.warn("[test catalog] seed skipped:", err)
    }
})

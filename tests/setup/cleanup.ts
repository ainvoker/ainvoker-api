import { afterAll, beforeAll } from "vitest";
import { cleanupAllTestUsers } from "../helpers/db.js";

/**
 * Sweeps leftover vitest-* users before/after the suite
 * (whether tests passed or failed). Soft-fails so unit tests
 * without a reachable DB still run.
 */
async function safeSweep() {
    try {
        await cleanupAllTestUsers();
    } catch (err) {
        console.warn("[test cleanup] sweep skipped:", err);
    }
}

beforeAll(safeSweep);
afterAll(safeSweep);
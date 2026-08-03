import { afterAll, afterEach, beforeAll, beforeEach } from "vitest"
import {
    cleanupAllTestUsers,
    cleanupTestUser,
    seedUserWithPersonalOrg,
    testUserId,
    type SeededAuthUser,
} from "./db.js"
import { authHeader } from "./auth.js"

/**
 * Seeds a User + Personal org before each test and deletes them after —
 * including when the test fails.
 *
 * Use for endpoints that expect an existing authenticated app user.
 */
export function useTestAuthUser(options?: {
    profile?: {
        firstName?: string | null
        lastName?: string | null
        profilePicture?: string | null
    }
}) {
    let current: SeededAuthUser | null = null

    beforeEach(async () => {
        current = await seedUserWithPersonalOrg(testUserId(), options?.profile)
    })

    afterEach(async () => {
        if (current) {
            await cleanupTestUser(current.userId)
            current = null
        }
    })

    return {
        /** Current seeded auth context (valid inside a test body). */
        get auth(): SeededAuthUser {
            if (!current) {
                throw new Error("Test auth user is not ready (call only inside a test)")
            }
            return current
        },
        headers() {
            return authHeader(this.auth.userId)
        },
    }
}

/**
 * Allocates a Neon-Auth-style user id without seeding the DB row.
 * Useful for tests that assert lazy creation via GET /me or bootstrap.
 * Always cleans up afterward (pass or fail).
 */
export function useEphemeralAuthId() {
    let userId = ""

    beforeEach(() => {
        userId = testUserId()
    })

    afterEach(async () => {
        if (userId) {
            await cleanupTestUser(userId)
            userId = ""
        }
    })

    return {
        get userId() {
            if (!userId) {
                throw new Error("Ephemeral auth id is not ready (call only inside a test)")
            }
            return userId
        },
        headers() {
            return authHeader(this.userId)
        },
    }
}

/**
 * Suite-level sweep for orphaned vitest-* users (crash / interrupted runs).
 * Call once from an integration setup file or the first describe in a file.
 */
export function useTestUserSweep() {
    beforeAll(async () => {
        await cleanupAllTestUsers()
    })

    afterAll(async () => {
        await cleanupAllTestUsers()
    })
}

import { describe, expect, it } from "vitest"
import { createApiKeySchema, apiKeyParamsSchema } from "../../src/modules/apiKeys/schemas.js"
import { createAllowedOriginSchema } from "../../src/modules/allowedOrigins/schemas.js"
import {
    createProjectSchema,
    updateProjectSchema,
    projectIdParamsSchema,
} from "../../src/modules/projects/schemas.js"
import { createOrganizationSchema, updateOrganizationSchema } from "../../src/modules/organizations/schemas.js"
import { updateProfileSchema } from "../../src/modules/users/schemas.js"

describe("createProjectSchema", () => {
    it("accepts a valid create body", () => {
        const parsed = createProjectSchema.parse({
            name: " Demo ",
            environment: "DEVELOPMENT",
        })
        expect(parsed.name).toBe("Demo")
        expect(parsed.environment).toBe("DEVELOPMENT")
    })

    it("rejects empty name", () => {
        expect(() =>
            createProjectSchema.parse({ name: "  ", environment: "PRODUCTION" }),
        ).toThrow()
    })
})

describe("updateProjectSchema", () => {
    it("requires at least one field", () => {
        expect(() => updateProjectSchema.parse({})).toThrow(/At least one field/)
    })

    it("accepts a partial update", () => {
        const parsed = updateProjectSchema.parse({ status: "ARCHIVED" })
        expect(parsed.status).toBe("ARCHIVED")
    })
})

describe("updateOrganizationSchema", () => {
    it("requires at least one field", () => {
        expect(() => updateOrganizationSchema.parse({})).toThrow(/At least one field/)
    })

    it("accepts a name-only update", () => {
        const parsed = updateOrganizationSchema.parse({ name: " Acme " })
        expect(parsed.name).toBe("Acme")
    })

    it("rejects an invalid slug", () => {
        expect(() => updateOrganizationSchema.parse({ slug: "Not Valid" })).toThrow()
    })
})

describe("createOrganizationSchema", () => {
    it("requires a paid plan", () => {
        expect(() => createOrganizationSchema.parse({ name: "Acme" })).toThrow()
    })
})

describe("projectIdParamsSchema", () => {
    it("requires projectId", () => {
        expect(projectIdParamsSchema.parse({ projectId: "abc" }).projectId).toBe("abc")
        expect(() => projectIdParamsSchema.parse({ projectId: "" })).toThrow()
    })
})

describe("createApiKeySchema", () => {
    it("accepts keyName and coerces expiresAt", () => {
        const parsed = createApiKeySchema.parse({
            keyName: " CI ",
            expiresAt: "2030-01-01T00:00:00.000Z",
        })
        expect(parsed.keyName).toBe("CI")
        expect(parsed.expiresAt).toBeInstanceOf(Date)
    })
})

describe("apiKeyParamsSchema", () => {
    it("requires projectId and keyId", () => {
        expect(
            apiKeyParamsSchema.parse({ projectId: "p1", keyId: "k1" }),
        ).toEqual({ projectId: "p1", keyId: "k1" })
    })
})

describe("createAllowedOriginSchema", () => {
    it("trims origin input", () => {
        const parsed = createAllowedOriginSchema.parse({ origin: " https://app.example.com " })
        expect(parsed.origin).toBe("https://app.example.com")
    })

    it("rejects empty origin", () => {
        expect(() => createAllowedOriginSchema.parse({ origin: "  " })).toThrow()
    })
})

describe("updateProfileSchema", () => {
    it("accepts a partial profile update", () => {
        const parsed = updateProfileSchema.parse({ firstName: " Ada " })
        expect(parsed.firstName).toBe("Ada")
    })

    it("accepts email", () => {
        const parsed = updateProfileSchema.parse({ email: " ada@example.com " })
        expect(parsed.email).toBe("ada@example.com")
    })

    it("rejects invalid email", () => {
        expect(() => updateProfileSchema.parse({ email: "not-an-email" })).toThrow()
    })

    it("allows clearing fields with null", () => {
        const parsed = updateProfileSchema.parse({ profilePicture: null })
        expect(parsed.profilePicture).toBeNull()
    })

    it("requires at least one field", () => {
        expect(() => updateProfileSchema.parse({})).toThrow(/At least one field/)
    })
})

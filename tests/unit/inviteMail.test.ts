import { describe, expect, it } from "vitest"
import { formatInviteEmail } from "../../src/modules/members/mail.js"

describe("formatInviteEmail", () => {
    const expiresAt = new Date("2026-10-02T12:00:00.000Z")
    const acceptUrl = "http://localhost:5173/invites/accept?token=abc%2Bdef"

    it("includes organization, role, accept link, and expiry", () => {
        const formatted = formatInviteEmail({
            to: "person@example.com",
            organizationName: "Acme",
            role: "admin",
            acceptUrl,
            expiresAt,
        })

        expect(formatted.subject).toBe("Join Acme on AInvoker")
        expect(formatted.text).toContain("Acme")
        expect(formatted.text).toContain("admin")
        expect(formatted.text).toContain(acceptUrl)
        expect(formatted.text).toContain(expiresAt.toUTCString())
        expect(formatted.html).toContain("Acme")
        expect(formatted.html).toContain("admin")
        expect(formatted.html).toContain(acceptUrl)
        expect(formatted.html).toContain(expiresAt.toUTCString())
    })

    it("escapes HTML in the organization name", () => {
        const formatted = formatInviteEmail({
            to: "person@example.com",
            organizationName: `A<b> & "Co"`,
            role: "member",
            acceptUrl,
            expiresAt,
        })

        expect(formatted.html).toContain("A&lt;b&gt; &amp; &quot;Co&quot;")
        expect(formatted.html).not.toContain("<b>")
        expect(formatted.text).toContain(`A<b> & "Co"`)
    })
})
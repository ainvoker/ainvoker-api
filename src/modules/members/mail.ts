import env from "../../config/env.js"

export type InviteEmailInput = {
    to: string
    organizationName: string
    role: string
    acceptUrl: string
    expiresAt: Date
}

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
}

/** Plain-text and HTML bodies for an organization invite. Does not send. */
export function formatInviteEmail(input: InviteEmailInput): {
    subject: string
    text: string
    html: string
} {
    const expires = input.expiresAt.toUTCString()
    const subject = `Join ${input.organizationName} on AInvoker`
    const text = [
        `You're invited to join ${input.organizationName} as ${input.role}.`,
        "",
        "Accept the invite:",
        input.acceptUrl,
        "",
        `This link expires ${expires}.`,
    ].join("\n")

    const organizationName = escapeHtml(input.organizationName)
    const role = escapeHtml(input.role)
    const acceptUrl = escapeHtml(input.acceptUrl)
    const expiresLabel = escapeHtml(expires)

    const html = [
        `<p>You're invited to join <strong>${organizationName}</strong> as <strong>${role}</strong>.</p>`,
        `<p><a href="${acceptUrl}">Accept the invite</a></p>`,
        `<p>Or paste this link into your browser:<br>${acceptUrl}</p>`,
        `<p>This link expires ${expiresLabel}.</p>`,
    ].join("")

    return { subject, text, html }
}

/**
 * Sends the invite via Resend. Errors omit the accept link so callers can log them safely.
 */
export async function sendInviteEmail(input: InviteEmailInput): Promise<void> {
    const apiKey = env.RESEND_API_KEY
    const from = env.INVITE_EMAIL_FROM
    if (!apiKey || !from) {
        throw new Error("Invite email is not configured")
    }

    const formatted = formatInviteEmail(input)
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to: [input.to],
            subject: formatted.subject,
            text: formatted.text,
            html: formatted.html,
        }),
    })

    if (!response.ok) {
        throw new Error(`Invite email provider returned ${response.status}`)
    }
}

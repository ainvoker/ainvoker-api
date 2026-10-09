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

type CloudflareSendEmailResponse = {
    success?: boolean
}

/**
 * Sends the invite via Cloudflare Email Sending REST API. Errors omit the accept link so callers can log them safely.
 */
export async function sendInviteEmail(input: InviteEmailInput): Promise<void> {
    const apiToken = env.CLOUDFLARE_API_TOKEN
    const accountId = env.CLOUDFLARE_ACCOUNT_ID
    const from = env.INVITE_EMAIL_FROM
    if (!apiToken || !accountId || !from) {
        throw new Error("Invite email is not configured")
    }

    const formatted = formatInviteEmail(input)
    const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from,
                to: [input.to],
                subject: formatted.subject,
                text: formatted.text,
                html: formatted.html,
            }),
        },
    )

    const body = (await response.json()) as CloudflareSendEmailResponse
    if (!response.ok || body.success === false) {
        throw new Error(`Invite email provider returned ${response.status}`)
    }
}

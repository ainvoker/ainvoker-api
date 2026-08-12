import env from "../../../config/env.js"
import { AppError } from "../../../platform/errors.js"

export type XenditSessionResponse = {
    payment_session_id: string
    components_sdk_key?: string
    expires_at?: string
    status?: string
    customer_id?: string
}

export type XenditCustomer = {
    id: string
    reference_id?: string
}

type XenditErrorBody = {
    error_code?: string
    message?: string
}

function xenditAuthHeader() {
    if (!env.XENDIT_SECRET_KEY) {
        throw new AppError(503, "BILLING_DISABLED", "Billing is not configured")
    }
    return `Basic ${Buffer.from(`${env.XENDIT_SECRET_KEY}:`).toString("base64")}`
}

function toAppError(status: number, data: XenditErrorBody, fallback: string) {
    const message = data.message ?? fallback
    return new AppError(status >= 400 && status < 600 ? 502 : 502, "PAYMENT_PROVIDER_ERROR", message)
}

export function isDuplicateCustomerReferenceError(err: unknown): boolean {
    if (!(err instanceof AppError)) return false
    const msg = err.message.toLowerCase()
    return msg.includes("reference_id") && (msg.includes("used before") || msg.includes("already"))
}

export async function createXenditSession(body: Record<string, unknown>): Promise<XenditSessionResponse> {
    const res = await fetch("https://api.xendit.co/sessions", {
        method: "POST",
        headers: {
            Authorization: xenditAuthHeader(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    })

    const data = (await res.json()) as XenditSessionResponse & XenditErrorBody

    if (!res.ok) {
        throw toAppError(res.status, data, `Xendit session create failed (${res.status})`)
    }

    if (!data.components_sdk_key) {
        throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Xendit did not return components_sdk_key")
    }

    return data
}

export async function getXenditSession(sessionId: string): Promise<XenditSessionResponse | null> {
    const res = await fetch(`https://api.xendit.co/sessions/${encodeURIComponent(sessionId)}`, {
        method: "GET",
        headers: {
            Authorization: xenditAuthHeader(),
            "Content-Type": "application/json",
        },
    })

    if (res.status === 404) {
        return null
    }

    const data = (await res.json()) as XenditSessionResponse & XenditErrorBody
    if (!res.ok) {
        throw toAppError(res.status, data, `Xendit session get failed (${res.status})`)
    }

    return data
}

export async function findXenditCustomerByReference(
    referenceId: string,
): Promise<XenditCustomer | null> {
    const url = new URL("https://api.xendit.co/customers")
    url.searchParams.set("reference_id", referenceId)

    const res = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: xenditAuthHeader(),
            "Content-Type": "application/json",
        },
    })

    const data = (await res.json()) as { data?: XenditCustomer[] } & XenditErrorBody
    if (!res.ok) {
        throw toAppError(res.status, data, `Xendit customer lookup failed (${res.status})`)
    }

    const customers = data.data ?? []
    return customers.find((c) => c.reference_id === referenceId) ?? customers[0] ?? null
}

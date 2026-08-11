import env from "../../../config/env.js";
import { AppError } from "../../../platform/errors.js";
export async function createXenditSession(body) {
    if (!env.XENDIT_SECRET_KEY) {
        throw new AppError(503, "BILLING_DISABLED", "Billing is not configured");
    }
    const res = await fetch("https://api.xendit.co/sessions", {
        method: "POST",
        headers: {
            Authorization: `Basic ${Buffer.from(`${env.XENDIT_SECRET_KEY}:`).toString("base64")}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    const data = (await res.json());
    if (!res.ok) {
        throw new AppError(502, "PAYMENT_PROVIDER_ERROR", data.message ?? `Xendit session create failed (${res.status})`);
    }
    if (!data.components_sdk_key) {
        throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Xendit did not return components_sdk_key");
    }
    return data;
}
//# sourceMappingURL=client.js.map
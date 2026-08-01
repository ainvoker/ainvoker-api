import { createHash, randomBytes } from "node:crypto";
const KEY_PREFIX_LENGTH = 12;
export function generateApiKey() {
    const plaintext = `ain_${randomBytes(32).toString("base64url")}`;
    return {
        plaintext,
        keyHash: hashApiKey(plaintext),
        keyPrefix: plaintext.slice(0, KEY_PREFIX_LENGTH),
    };
}
export function hashApiKey(plaintext) {
    return createHash("sha256").update(plaintext).digest("hex");
}
//# sourceMappingURL=hash.js.map
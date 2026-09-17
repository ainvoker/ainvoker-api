import { createHash, randomBytes } from "node:crypto"

const INVITE_TOKEN_BYTES = 32

export function generateInviteToken(): { plaintext: string; tokenHash: string } {
    const plaintext = randomBytes(INVITE_TOKEN_BYTES).toString("base64url")
    return {
        plaintext,
        tokenHash: hashInviteToken(plaintext),
    }
}

export function hashInviteToken(plaintext: string): string {
    return createHash("sha256").update(plaintext).digest("hex")
}

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

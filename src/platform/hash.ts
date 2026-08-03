import { createHash, randomBytes } from "node:crypto"

class ApiKeyHasher {
    private readonly keyPrefixLength = 12;

    generate(): { plaintext: string, keyHash: string, keyPrefix: string } {
        const plaintext = `ain_${randomBytes(32).toString("base64url")}`
        return {
            plaintext,
            keyHash: this.hash(plaintext),
            keyPrefix: plaintext.slice(0, this.keyPrefixLength),
        }
    }

    hash(plaintext: string): string {
        return createHash("sha256").update(plaintext).digest("hex")
    }
}

export default new ApiKeyHasher()

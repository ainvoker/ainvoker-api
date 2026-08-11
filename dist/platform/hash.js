import { createHash, randomBytes } from "node:crypto";
class ApiKeyHasher {
    keyPrefixLength = 12;
    generate() {
        const plaintext = `ain_${randomBytes(32).toString("base64url")}`;
        return {
            plaintext,
            keyHash: this.hash(plaintext),
            keyPrefix: plaintext.slice(0, this.keyPrefixLength),
        };
    }
    hash(plaintext) {
        return createHash("sha256").update(plaintext).digest("hex");
    }
}
export default new ApiKeyHasher();
//# sourceMappingURL=hash.js.map
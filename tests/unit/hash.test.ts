import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import apiKeyHasher from "../../src/platform/hash.js";

describe("apiKeyHasher", () => {
    it("hashes plaintext with sha256 hex", () => {
        const plaintext = "ain_test_key_value";
        expect(apiKeyHasher.hash(plaintext)).toBe(
            createHash("sha256").update(plaintext).digest("hex"),
        );
    });

    it("generate returns ain_ plaintext, matching hash, and 12-char prefix", () => {
        const result = apiKeyHasher.generate();

        expect(result.plaintext.startsWith("ain_")).toBe(true);
        expect(result.keyPrefix).toBe(result.plaintext.slice(0, 12));
        expect(result.keyPrefix).toHaveLength(12);
        expect(result.keyHash).toBe(apiKeyHasher.hash(result.plaintext));
    });

    it("generate produces unique keys", () => {
        const a = apiKeyHasher.generate();
        const b = apiKeyHasher.generate();
        expect(a.plaintext).not.toBe(b.plaintext);
        expect(a.keyHash).not.toBe(b.keyHash);
    });
});

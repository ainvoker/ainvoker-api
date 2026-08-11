declare class ApiKeyHasher {
    private readonly keyPrefixLength;
    generate(): {
        plaintext: string;
        keyHash: string;
        keyPrefix: string;
    };
    hash(plaintext: string): string;
}
declare const _default: ApiKeyHasher;
export default _default;
//# sourceMappingURL=hash.d.ts.map
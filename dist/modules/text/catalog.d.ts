/**
 * Idempotent seed for the MVP text catalog (openai + gemini Flash).
 * Safe to call on every chat request; runs the upsert work at most once per process.
 */
export declare function ensureTextCatalog(): Promise<void>;
export declare const textCatalogDefaults: {
    readonly providerName: "openai";
    readonly modelName: "gpt-4o-mini";
    readonly modelSlug: "openai/gpt-4o-mini";
    readonly geminiModelSlug: "gemini/gemini-3.6-flash";
};
//# sourceMappingURL=catalog.d.ts.map
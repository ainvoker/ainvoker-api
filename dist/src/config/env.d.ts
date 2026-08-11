import "dotenv/config";
declare class EnvConfig {
    readonly NODE_ENV: "development" | "test" | "production";
    readonly PORT: number;
    readonly DATABASE_URL: string;
    readonly NEON_AUTH_URL: string;
    readonly CORS_ORIGIN: string;
    readonly OPENAI_API_KEY: string | undefined;
    readonly GEMINI_API_KEY: string | undefined;
    readonly BILLING_ENABLED: boolean;
    readonly XENDIT_SECRET_KEY: string | undefined;
    readonly XENDIT_WEBHOOK_TOKEN: string | undefined;
    readonly XENDIT_PRO_AMOUNT: number;
    constructor();
}
declare const _default: EnvConfig;
export default _default;
//# sourceMappingURL=env.d.ts.map
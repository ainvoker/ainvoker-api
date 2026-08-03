import "dotenv/config";
declare class EnvConfig {
    readonly NODE_ENV: "development" | "test" | "production";
    readonly PORT: number;
    readonly DATABASE_URL: string;
    readonly NEON_AUTH_URL: string;
    readonly CORS_ORIGIN: string;
    constructor();
}
declare const _default: EnvConfig;
export default _default;
//# sourceMappingURL=env.d.ts.map
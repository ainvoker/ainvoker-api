import type { ChatProvider } from "./types.js";
declare class ChatProviderRegistry {
    private readonly providers;
    register(name: string, provider: ChatProvider): void;
    get(name: string): ChatProvider;
    has(name: string): boolean;
}
declare const _default: ChatProviderRegistry;
export default _default;
//# sourceMappingURL=registry.d.ts.map
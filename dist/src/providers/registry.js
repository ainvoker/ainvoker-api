import { AppError } from "../platform/errors.js";
class ChatProviderRegistry {
    providers = new Map();
    register(name, provider) {
        this.providers.set(name, provider);
    }
    get(name) {
        const provider = this.providers.get(name);
        if (!provider) {
            throw new AppError(501, "PROVIDER_NOT_IMPLEMENTED", `No chat adapter registered for provider "${name}"`);
        }
        return provider;
    }
    has(name) {
        return this.providers.has(name);
    }
}
export default new ChatProviderRegistry();
//# sourceMappingURL=registry.js.map
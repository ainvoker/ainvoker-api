import { AppError } from "../platform/errors.js"
import type { ChatProvider } from "./types.js"

class ChatProviderRegistry {
    private readonly providers = new Map<string, ChatProvider>()

    register(name: string, provider: ChatProvider) {
        this.providers.set(name, provider)
    }

    get(name: string): ChatProvider {
        const provider = this.providers.get(name)
        if (!provider) {
            throw new AppError(
                501,
                "PROVIDER_NOT_IMPLEMENTED",
                `No chat adapter registered for provider "${name}"`,
            )
        }
        return provider
    }

    has(name: string): boolean {
        return this.providers.has(name)
    }
}

export default new ChatProviderRegistry()

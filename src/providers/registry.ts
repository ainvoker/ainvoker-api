import { AppError } from "../platform/errors.js"
import type { ChatProvider, ImageProvider } from "./types.js"

class ProviderRegistry<T> {
    private readonly providers = new Map<string, T>()

    constructor(private readonly kind: string) {}

    register(name: string, provider: T) {
        this.providers.set(name, provider)
    }

    get(name: string): T {
        const provider = this.providers.get(name)
        if (!provider) {
            throw new AppError(
                501,
                "PROVIDER_NOT_IMPLEMENTED",
                `No ${this.kind} adapter registered for provider "${name}"`,
            )
        }
        return provider
    }

    has(name: string): boolean {
        return this.providers.has(name)
    }
}

export const imageProviderRegistry = new ProviderRegistry<ImageProvider>("image")

export default new ProviderRegistry<ChatProvider>("chat")

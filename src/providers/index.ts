import openaiChatProvider from "./openai.js"
import chatProviderRegistry from "./registry.js"

chatProviderRegistry.register("openai", openaiChatProvider)

export { chatProviderRegistry }
export default chatProviderRegistry

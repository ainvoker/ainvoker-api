import geminiChatProvider from "./gemini.js"
import geminiImageProvider from "./geminiImage.js"
import openaiChatProvider from "./openai.js"
import openaiImageProvider from "./openaiImage.js"
import chatProviderRegistry, { imageProviderRegistry } from "./registry.js"

chatProviderRegistry.register("openai", openaiChatProvider)
chatProviderRegistry.register("gemini", geminiChatProvider)

imageProviderRegistry.register("openai", openaiImageProvider)
imageProviderRegistry.register("gemini", geminiImageProvider)

export { chatProviderRegistry, imageProviderRegistry }
export default chatProviderRegistry

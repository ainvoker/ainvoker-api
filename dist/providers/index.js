import geminiChatProvider from "./gemini.js";
import openaiChatProvider from "./openai.js";
import chatProviderRegistry from "./registry.js";
chatProviderRegistry.register("openai", openaiChatProvider);
chatProviderRegistry.register("gemini", geminiChatProvider);
export { chatProviderRegistry };
export default chatProviderRegistry;
//# sourceMappingURL=index.js.map
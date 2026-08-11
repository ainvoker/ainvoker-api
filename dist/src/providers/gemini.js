import env from "../config/env.js";
import { AppError } from "../platform/errors.js";
function mapMessages(messages) {
    const systemParts = [];
    const contents = [];
    for (const message of messages) {
        if (message.role === "system") {
            systemParts.push(message.content);
            continue;
        }
        contents.push({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: message.content }],
        });
    }
    return {
        systemInstruction: systemParts.length > 0
            ? { parts: [{ text: systemParts.join("\n\n") }] }
            : undefined,
        contents,
    };
}
class GeminiChatProvider {
    async complete(input) {
        if (!env.GEMINI_API_KEY) {
            throw new AppError(503, "PROVIDER_MISCONFIGURED", "GEMINI_API_KEY is not configured");
        }
        const baseUrl = input.baseUrl.replace(/\/$/, "");
        const url = `${baseUrl}/models/${encodeURIComponent(input.model)}:generateContent`;
        const { systemInstruction, contents } = mapMessages(input.messages);
        if (contents.length === 0) {
            throw new AppError(400, "VALIDATION_ERROR", "At least one user or assistant message is required");
        }
        const body = { contents };
        if (systemInstruction) {
            body.systemInstruction = systemInstruction;
        }
        const generationConfig = {};
        if (input.temperature !== undefined) {
            generationConfig.temperature = input.temperature;
        }
        if (input.maxTokens !== undefined) {
            generationConfig.maxOutputTokens = input.maxTokens;
        }
        if (Object.keys(generationConfig).length > 0) {
            body.generationConfig = generationConfig;
        }
        let response;
        try {
            response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": env.GEMINI_API_KEY,
                },
                body: JSON.stringify(body),
            });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "Upstream request failed";
            throw new AppError(502, "UPSTREAM_ERROR", message);
        }
        const raw = (await response.json().catch(() => null));
        if (!response.ok) {
            const message = raw?.error?.message ?? `Gemini request failed (${response.status})`;
            throw new AppError(response.status >= 400 && response.status < 500 ? 400 : 502, "UPSTREAM_ERROR", message);
        }
        const parts = raw?.candidates?.[0]?.content?.parts ?? [];
        const content = parts
            .map((part) => part.text)
            .filter((text) => typeof text === "string" && text.length > 0)
            .join("");
        if (!content) {
            throw new AppError(502, "UPSTREAM_ERROR", "Gemini returned no assistant message");
        }
        const meta = raw?.usageMetadata;
        const usage = meta &&
            typeof meta.promptTokenCount === "number" &&
            typeof meta.candidatesTokenCount === "number"
            ? {
                inputTokens: meta.promptTokenCount,
                outputTokens: meta.candidatesTokenCount,
                totalTokens: typeof meta.totalTokenCount === "number"
                    ? meta.totalTokenCount
                    : meta.promptTokenCount + meta.candidatesTokenCount,
            }
            : null;
        return {
            message: { role: "assistant", content },
            usage,
            raw,
        };
    }
}
export default new GeminiChatProvider();
//# sourceMappingURL=gemini.js.map
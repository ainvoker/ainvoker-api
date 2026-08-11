import env from "../config/env.js";
import { AppError } from "../platform/errors.js";
class OpenAIChatProvider {
    async complete(input) {
        if (!env.OPENAI_API_KEY) {
            throw new AppError(503, "PROVIDER_MISCONFIGURED", "OPENAI_API_KEY is not configured");
        }
        const baseUrl = input.baseUrl.replace(/\/$/, "");
        const url = `${baseUrl}/chat/completions`;
        const body = {
            model: input.model,
            messages: input.messages,
        };
        if (input.temperature !== undefined) {
            body.temperature = input.temperature;
        }
        if (input.maxTokens !== undefined) {
            body.max_tokens = input.maxTokens;
        }
        let response;
        try {
            response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
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
            const message = raw?.error?.message ?? `OpenAI request failed (${response.status})`;
            throw new AppError(response.status >= 400 && response.status < 500 ? 400 : 502, "UPSTREAM_ERROR", message);
        }
        const content = raw?.choices?.[0]?.message?.content;
        if (typeof content !== "string") {
            throw new AppError(502, "UPSTREAM_ERROR", "OpenAI returned no assistant message");
        }
        const usage = raw?.usage &&
            typeof raw.usage.prompt_tokens === "number" &&
            typeof raw.usage.completion_tokens === "number"
            ? {
                inputTokens: raw.usage.prompt_tokens,
                outputTokens: raw.usage.completion_tokens,
                totalTokens: typeof raw.usage.total_tokens === "number"
                    ? raw.usage.total_tokens
                    : raw.usage.prompt_tokens + raw.usage.completion_tokens,
            }
            : null;
        return {
            message: { role: "assistant", content },
            usage,
            raw,
        };
    }
}
export default new OpenAIChatProvider();
//# sourceMappingURL=openai.js.map
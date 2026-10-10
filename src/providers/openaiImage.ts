import env from "../config/env.js"
import { AppError } from "../platform/errors.js"
import type {
    ChatCompletionUsage,
    ImageGenerationInput,
    ImageGenerationResult,
    ImageProvider,
} from "./types.js"

type OpenAIImageResponse = {
    created?: number
    data?: Array<{
        b64_json?: string
        revised_prompt?: string
    }>
    output_format?: string
    usage?: {
        input_tokens?: number
        output_tokens?: number
        total_tokens?: number
    }
    error?: {
        message?: string
    }
}

const MIME_TYPES: Record<string, string> = {
    png: "image/png",
    jpeg: "image/jpeg",
    webp: "image/webp",
}

function mapUsage(usage: OpenAIImageResponse["usage"]): ChatCompletionUsage | null {
    if (
        !usage ||
        typeof usage.input_tokens !== "number" ||
        typeof usage.output_tokens !== "number"
    ) {
        return null
    }
    return {
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        totalTokens:
            typeof usage.total_tokens === "number"
                ? usage.total_tokens
                : usage.input_tokens + usage.output_tokens,
    }
}

function buildRequestBody(input: ImageGenerationInput): Record<string, unknown> {
    const body: Record<string, unknown> = {
        model: input.model,
        prompt: input.prompt,
        n: input.n,
    }
    if (input.size !== undefined) {
        body.size = input.size
    }
    if (input.quality !== undefined) {
        body.quality = input.quality
    }
    if (input.outputFormat !== undefined) {
        body.output_format = input.outputFormat
    }
    return body
}

class OpenAIImageProvider implements ImageProvider {
    async generate(input: ImageGenerationInput): Promise<ImageGenerationResult> {
        if (!env.OPENAI_API_KEY) {
            throw new AppError(503, "PROVIDER_MISCONFIGURED", "OPENAI_API_KEY is not configured")
        }
        const baseUrl = input.baseUrl.replace(/\/$/, "")
        const url = `${baseUrl}/images/generations`

        let response: Response
        try {
            response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(buildRequestBody(input)),
            })
        } catch (err) {
            const message = err instanceof Error ? err.message : "Upstream request failed"
            throw new AppError(502, "UPSTREAM_ERROR", message)
        }

        const raw = (await response.json().catch(() => null)) as OpenAIImageResponse | null

        if (!response.ok) {
            const message = raw?.error?.message ?? `OpenAI request failed (${response.status})`
            throw new AppError(
                response.status >= 400 && response.status < 500 ? 400 : 502,
                "UPSTREAM_ERROR",
                message,
            )
        }

        const mimeType = MIME_TYPES[raw?.output_format ?? input.outputFormat ?? "png"] ?? "image/png"
        const images = (raw?.data ?? [])
            .filter((item) => typeof item.b64_json === "string" && item.b64_json.length > 0)
            .map((item) => ({
                base64: item.b64_json!,
                mimeType,
                ...(item.revised_prompt ? { revisedPrompt: item.revised_prompt } : {}),
            }))
        if (images.length === 0) {
            throw new AppError(502, "UPSTREAM_ERROR", "OpenAI returned no images")
        }

        // Image bytes are returned to the caller but not persisted on the request log.
        const { data, ...rest } = raw ?? {}
        return {
            images,
            usage: mapUsage(raw?.usage),
            raw: {
                ...rest,
                data: (data ?? []).map(({ b64_json, ...item }) => ({
                    ...item,
                    ...(b64_json ? { b64Length: b64_json.length } : {}),
                })),
            },
        }
    }
}

export default new OpenAIImageProvider()

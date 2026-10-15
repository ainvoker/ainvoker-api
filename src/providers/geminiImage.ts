import env from "../config/env.js"
import { AppError } from "../platform/errors.js"
import { fetchProvider, providerHttpError } from "./upstream.js"
import type {
    ChatCompletionUsage,
    GeneratedImage,
    ImageGenerationInput,
    ImageGenerationResult,
    ImageProvider,
} from "./types.js"

type InteractionContent = {
    type?: string
    data?: string
    mime_type?: string
    text?: string
}

type InteractionResponse = {
    id?: string
    status?: string
    steps?: Array<{
        type?: string
        content?: InteractionContent[]
    }>
    usage?: {
        total_input_tokens?: number
        total_output_tokens?: number
        total_tokens?: number
    }
    error?: {
        message?: string
    }
}

function mapUsage(usage: InteractionResponse["usage"]): ChatCompletionUsage | null {
    if (
        !usage ||
        typeof usage.total_input_tokens !== "number" ||
        typeof usage.total_output_tokens !== "number"
    ) {
        return null
    }
    return {
        inputTokens: usage.total_input_tokens,
        outputTokens: usage.total_output_tokens,
        totalTokens:
            typeof usage.total_tokens === "number"
                ? usage.total_tokens
                : usage.total_input_tokens + usage.total_output_tokens,
    }
}

function sumUsage(usages: Array<ChatCompletionUsage | null>): ChatCompletionUsage | null {
    if (usages.some((usage) => usage === null)) {
        return null
    }
    return usages.reduce<ChatCompletionUsage>(
        (total, usage) => ({
            inputTokens: total.inputTokens + usage!.inputTokens,
            outputTokens: total.outputTokens + usage!.outputTokens,
            totalTokens: total.totalTokens + usage!.totalTokens,
        }),
        { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    )
}

/** The last image block of the model output, matching the SDK's `output_image`. */
function outputImage(raw: InteractionResponse | null): GeneratedImage | null {
    const blocks = (raw?.steps ?? [])
        .filter((step) => step.type === "model_output")
        .flatMap((step) => step.content ?? [])
        .filter((block) => block.type === "image" && typeof block.data === "string" && block.data.length > 0)
    const last = blocks.at(-1)
    return last ? { base64: last.data!, mimeType: last.mime_type ?? "image/png" } : null
}

/** Response with image bytes replaced by their length, for AIRequest.responsePayload.raw */
function stripImageBytes(raw: InteractionResponse | null): unknown {
    if (!raw) return null
    return {
        ...raw,
        steps: (raw.steps ?? []).map((step) => ({
            ...step,
            content: (step.content ?? []).map(({ data, ...block }) => ({
                ...block,
                ...(data ? { dataLength: data.length } : {}),
            })),
        })),
    }
}

/**
 * Gemini native image generation (Nano Banana) via the Interactions API.
 * Gateway size/quality/outputFormat are OpenAI-specific and not forwarded.
 */
class GeminiImageProvider implements ImageProvider {
    private async generateOne(url: string, apiKey: string, input: ImageGenerationInput) {
        const response = await fetchProvider("Gemini", url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({ model: input.model, input: input.prompt, store: false }),
        })

        const raw = (await response.json().catch(() => null)) as InteractionResponse | null

        if (!response.ok) {
            throw providerHttpError("Gemini", response.status, raw?.error?.message)
        }

        const image = outputImage(raw)
        if (!image) {
            throw new AppError(502, "UPSTREAM_ERROR", "Gemini returned no image")
        }
        return { image, usage: mapUsage(raw?.usage), raw: stripImageBytes(raw) }
    }

    async generate(input: ImageGenerationInput): Promise<ImageGenerationResult> {
        if (!env.GEMINI_API_KEY) {
            throw new AppError(503, "PROVIDER_MISCONFIGURED", "GEMINI_API_KEY is not configured")
        }
        const url = `${input.baseUrl.replace(/\/$/, "")}/interactions`

        // One interaction returns one image; run them in order so a failure stops further spend.
        const results = []
        for (let i = 0; i < input.n; i += 1) {
            results.push(await this.generateOne(url, env.GEMINI_API_KEY, input))
        }

        return {
            images: results.map((result) => result.image),
            usage: sumUsage(results.map((result) => result.usage)),
            raw: { interactions: results.map((result) => result.raw) },
        }
    }
}

export default new GeminiImageProvider()

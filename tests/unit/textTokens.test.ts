import { describe, expect, it } from "vitest"
import {
    DEFAULT_OUTPUT_TOKEN_HOLD,
    estimateTextTokenHold,
} from "../../src/modules/text/tokens.js"

describe("estimateTextTokenHold", () => {
    it("reserves one token per character plus framing, and the default output hold", () => {
        expect(estimateTextTokenHold([{ content: "Hi" }], undefined)).toEqual({
            inputTokens: 6,
            outputTokens: DEFAULT_OUTPUT_TOKEN_HOLD,
        })
    })

    it("uses an explicit maxTokens as the output hold", () => {
        expect(
            estimateTextTokenHold(
                [
                    { content: "Be brief" },
                    { content: "Say hello" },
                ],
                50,
            ),
        ).toEqual({
            inputTokens: 4 + "Be brief".length + 4 + "Say hello".length,
            outputTokens: 50,
        })
    })

    it("counts tool definitions, tool-call arguments, and tool results by JSON length", () => {
        const tools = [
            { name: "get_weather", parameters: { type: "object", properties: {} } },
        ]
        const args = { city: "Manila" }
        const result = '{"tempC":31}'

        expect(
            estimateTextTokenHold(
                [
                    { content: "Weather?" },
                    { content: "", toolCalls: [{ arguments: args }] },
                    { content: result },
                ],
                undefined,
                tools,
            ),
        ).toEqual({
            inputTokens:
                4 + "Weather?".length +
                4 + JSON.stringify(args).length +
                4 + result.length +
                JSON.stringify(tools).length,
            outputTokens: DEFAULT_OUTPUT_TOKEN_HOLD,
        })
    })
})

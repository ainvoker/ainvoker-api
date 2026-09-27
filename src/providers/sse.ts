/**
 * Yields each SSE `data:` payload (joined multi-line data fields) from a fetch body.
 * Ignores comment lines and event/id/retry fields.
 */
export async function* parseSseDataPayloads(
    body: ReadableStream<Uint8Array>,
    signal?: AbortSignal,
): AsyncGenerator<string> {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    const dataLines: string[] = []

    const flushEvent = (): string | null => {
        if (dataLines.length === 0) {
            return null
        }
        const payload = dataLines.join("\n")
        dataLines.length = 0
        return payload
    }

    const onAbort = () => {
        void reader.cancel().catch(() => undefined)
    }
    signal?.addEventListener("abort", onAbort)
    if (signal?.aborted) {
        onAbort()
    }

    try {
        while (true) {
            if (signal?.aborted) {
                break
            }

            const { done, value } = await reader.read()
            if (done) {
                break
            }

            buffer += decoder.decode(value, { stream: true })

            while (true) {
                const newlineIndex = buffer.indexOf("\n")
                if (newlineIndex < 0) {
                    break
                }

                let line = buffer.slice(0, newlineIndex)
                buffer = buffer.slice(newlineIndex + 1)
                if (line.endsWith("\r")) {
                    line = line.slice(0, -1)
                }

                if (line === "") {
                    const payload = flushEvent()
                    if (payload !== null) {
                        yield payload
                    }
                    continue
                }

                if (line.startsWith(":")) {
                    continue
                }

                if (line.startsWith("data:")) {
                    dataLines.push(line.slice(5).replace(/^ /, ""))
                }
            }
        }

        if (!signal?.aborted) {
            buffer += decoder.decode()
            if (buffer.length > 0) {
                const trailing = buffer.replace(/\r$/, "")
                if (trailing.startsWith("data:")) {
                    dataLines.push(trailing.slice(5).replace(/^ /, ""))
                }
            }

            const payload = flushEvent()
            if (payload !== null) {
                yield payload
            }
        }
    } finally {
        signal?.removeEventListener("abort", onAbort)
        try {
            reader.releaseLock()
        } catch {
            // already cancelled / released
        }
    }
}

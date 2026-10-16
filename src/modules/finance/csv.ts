export type XenditCsvRow = {
    reference: string
    amountPhp: number
    line: number
}

export type ProviderCsvRow = {
    provider: string
    amount: number
    currency: "usd" | "php"
    line: number
}

export type XenditMatchResult = {
    reference: string
    csvAmountPhp: number | null
    dbAmountPhp: number | null
    status: "matched" | "amount_mismatch" | "csv_only" | "db_only"
}

export type ProviderMatchResult = {
    provider: string
    csvAmountUsd: number | null
    dbAmountUsd: number | null
    status: "matched" | "amount_mismatch" | "csv_only" | "db_only"
}

const AMOUNT_TOLERANCE_PHP = 0.01
const AMOUNT_TOLERANCE_USD = 0.5

function splitCsvLine(line: string): string[] {
    const cells: string[] = []
    let current = ""
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"'
                i++
            } else {
                inQuotes = !inQuotes
            }
            continue
        }
        if (ch === "," && !inQuotes) {
            cells.push(current.trim())
            current = ""
            continue
        }
        current += ch
    }
    cells.push(current.trim())
    return cells
}

function normalizeHeader(h: string): string {
    return h.trim().toLowerCase().replace(/[\s-]+/g, "_")
}

function parseCsvTable(csvText: string): { headers: string[]; rows: string[][] } {
    const lines = csvText
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
    const headerLine = lines[0]
    if (!headerLine) {
        return { headers: [], rows: [] }
    }
    const headers = splitCsvLine(headerLine).map(normalizeHeader)
    const rows = lines.slice(1).map(splitCsvLine)
    return { headers, rows }
}

function findColumn(headers: string[], aliases: string[]): number {
    for (const alias of aliases) {
        const idx = headers.indexOf(alias)
        if (idx >= 0) return idx
    }
    return -1
}

function parseNumber(raw: string): number | null {
    const cleaned = raw.replace(/[^0-9.+-]/g, "")
    if (!cleaned) return null
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : null
}

/** Detect pesos vs centavos from the amount column header only. */
function toPhpAmount(raw: number, amountHeader: string): number {
    if (amountHeader.toLowerCase().includes("centavo")) return raw / 100
    return raw
}

export function parseXenditCsv(csvText: string): XenditCsvRow[] {
    const { headers, rows } = parseCsvTable(csvText)
    const refIdx = findColumn(headers, [
        "reference",
        "external_id",
        "reference_number",
        "id",
        "payment_id",
    ])
    const amountIdx = findColumn(headers, [
        "amount",
        "settled_amount",
        "settlement_amount",
        "amount_php",
        "amount_centavos",
    ])
    if (refIdx < 0 || amountIdx < 0) {
        throw new Error(
            "Xendit CSV must include a reference column (reference, external_id, reference_number, id) and an amount column",
        )
    }
    const amountHeader = headers[amountIdx] ?? "amount"
    const out: XenditCsvRow[] = []
    rows.forEach((cells, i) => {
        const reference = (cells[refIdx] ?? "").trim()
        const amountRaw = parseNumber(cells[amountIdx] ?? "")
        if (!reference || amountRaw === null) return
        out.push({
            reference,
            amountPhp: toPhpAmount(amountRaw, amountHeader),
            line: i + 2,
        })
    })
    return out
}

export type ProviderCsvBounds = { start: Date; end: Date }

/** OpenAI Usage Dashboard cost export: amount_value + day timestamps. */
export function isOpenAiCostCsv(headers: string[]): boolean {
    const hasAmount = headers.includes("amount_value")
    const hasTime = headers.includes("start_time_iso") || headers.includes("start_time")
    return hasAmount && hasTime
}

function parseUnixSeconds(raw: string): Date | null {
    const n = Number(raw.trim())
    if (!Number.isFinite(n) || n <= 0) return null
    return new Date(n * 1000)
}

function parseIsoDate(raw: string): Date | null {
    const trimmed = raw.trim()
    if (!trimmed) return null
    const d = new Date(trimmed)
    return Number.isNaN(d.getTime()) ? null : d
}

/** Half-open interval overlap: [aStart, aEnd) overlaps [bStart, bEnd). */
function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
    return aStart < bEnd && aEnd > bStart
}

/**
 * Sum OpenAI cost-export rows that overlap the finance period.
 * Emits a single catalog provider row (`openai`).
 */
export function parseOpenAiCostCsv(csvText: string, bounds: ProviderCsvBounds): ProviderCsvRow[] {
    const { headers, rows } = parseCsvTable(csvText)
    if (!isOpenAiCostCsv(headers)) {
        throw new Error("Not an OpenAI cost CSV (expected amount_value and start_time / start_time_iso)")
    }

    const amountIdx = findColumn(headers, ["amount_value"])
    const currencyIdx = findColumn(headers, ["amount_currency"])
    const startIsoIdx = findColumn(headers, ["start_time_iso"])
    const endIsoIdx = findColumn(headers, ["end_time_iso"])
    const startUnixIdx = findColumn(headers, ["start_time"])
    const endUnixIdx = findColumn(headers, ["end_time"])

    let sum = 0
    let sawNonUsd = false

    rows.forEach((cells) => {
        const amountRaw = parseNumber(cells[amountIdx] ?? "")
        if (amountRaw === null) return

        const currency = (cells[currencyIdx] ?? "usd").trim().toLowerCase()
        if (currency && currency !== "usd") {
            sawNonUsd = true
            return
        }

        const rowStart =
            (startIsoIdx >= 0 ? parseIsoDate(cells[startIsoIdx] ?? "") : null) ??
            (startUnixIdx >= 0 ? parseUnixSeconds(cells[startUnixIdx] ?? "") : null)
        const rowEnd =
            (endIsoIdx >= 0 ? parseIsoDate(cells[endIsoIdx] ?? "") : null) ??
            (endUnixIdx >= 0 ? parseUnixSeconds(cells[endUnixIdx] ?? "") : null)

        if (!rowStart || !rowEnd) return
        if (!intervalsOverlap(rowStart, rowEnd, bounds.start, bounds.end)) return

        sum += amountRaw
    })

    if (sawNonUsd && sum === 0) {
        throw new Error("OpenAI cost CSV has no USD amount_value rows overlapping the selected period")
    }

    return [{ provider: "openai", amount: sum, currency: "usd", line: 0 }]
}

export function parseProviderCsv(
    csvText: string,
    bounds?: ProviderCsvBounds,
): ProviderCsvRow[] {
    const { headers, rows } = parseCsvTable(csvText)

    if (isOpenAiCostCsv(headers)) {
        if (!bounds) {
            throw new Error("OpenAI cost CSV requires a finance period (YYYY-MM) to filter days")
        }
        return parseOpenAiCostCsv(csvText, bounds)
    }

    const providerIdx = findColumn(headers, ["provider", "vendor", "supplier"])
    const amountIdx = findColumn(headers, [
        "amount_usd",
        "amount_php",
        "amount",
        "total",
        "total_usd",
        "total_php",
        "cost",
        "cost_usd",
    ])
    if (providerIdx < 0 || amountIdx < 0) {
        throw new Error(
            "Provider CSV must include a provider/vendor column and an amount/amount_usd column (or an OpenAI Usage cost export with amount_value)",
        )
    }
    const amountHeader = headers[amountIdx] ?? "amount"
    const currency: "usd" | "php" = amountHeader.includes("php") ? "php" : "usd"
    const out: ProviderCsvRow[] = []
    rows.forEach((cells, i) => {
        const provider = (cells[providerIdx] ?? "").trim()
        const amountRaw = parseNumber(cells[amountIdx] ?? "")
        if (!provider || amountRaw === null) return
        out.push({
            provider,
            amount: amountRaw,
            currency,
            line: i + 2,
        })
    })
    return out
}

export function matchXenditRows(
    csvRows: XenditCsvRow[],
    dbRows: Array<{ referenceNumber: string; amountPhp: number }>,
): { matchedCount: number; driftCount: number; items: XenditMatchResult[] } {
    const csvByRef = new Map<string, number>()
    for (const row of csvRows) {
        csvByRef.set(row.reference, (csvByRef.get(row.reference) ?? 0) + row.amountPhp)
    }
    const dbByRef = new Map<string, number>()
    for (const row of dbRows) {
        dbByRef.set(row.referenceNumber, (dbByRef.get(row.referenceNumber) ?? 0) + row.amountPhp)
    }

    const refs = new Set([...csvByRef.keys(), ...dbByRef.keys()])
    const items: XenditMatchResult[] = []
    let matchedCount = 0
    let driftCount = 0

    for (const reference of [...refs].sort()) {
        const csvAmountPhp = csvByRef.has(reference) ? csvByRef.get(reference)! : null
        const dbAmountPhp = dbByRef.has(reference) ? dbByRef.get(reference)! : null
        let status: XenditMatchResult["status"]
        if (csvAmountPhp === null) status = "db_only"
        else if (dbAmountPhp === null) status = "csv_only"
        else if (Math.abs(csvAmountPhp - dbAmountPhp) > AMOUNT_TOLERANCE_PHP) status = "amount_mismatch"
        else status = "matched"

        if (status === "matched") matchedCount++
        else driftCount++

        items.push({ reference, csvAmountPhp, dbAmountPhp, status })
    }

    return { matchedCount, driftCount, items }
}

/** Match provider CSV rows already normalized to USD. */
export function matchProviderRows(
    csvRows: Array<{ provider: string; amountUsd: number }>,
    dbRows: Array<{ provider: string; amountUsd: number }>,
    toleranceUsd = AMOUNT_TOLERANCE_USD,
): { matchedCount: number; driftCount: number; items: ProviderMatchResult[] } {
    const normalize = (s: string) => s.trim().toLowerCase()
    const csvByProvider = new Map<string, { label: string; amount: number }>()
    for (const row of csvRows) {
        const key = normalize(row.provider)
        const prev = csvByProvider.get(key)
        if (prev) prev.amount += row.amountUsd
        else csvByProvider.set(key, { label: row.provider, amount: row.amountUsd })
    }
    const dbByProvider = new Map<string, { label: string; amount: number }>()
    for (const row of dbRows) {
        const key = normalize(row.provider)
        const prev = dbByProvider.get(key)
        if (prev) prev.amount += row.amountUsd
        else dbByProvider.set(key, { label: row.provider, amount: row.amountUsd })
    }

    const keys = new Set([...csvByProvider.keys(), ...dbByProvider.keys()])
    const items: ProviderMatchResult[] = []
    let matchedCount = 0
    let driftCount = 0

    for (const key of [...keys].sort()) {
        const csv = csvByProvider.get(key)
        const db = dbByProvider.get(key)
        const csvAmountUsd = csv ? csv.amount : null
        const dbAmountUsd = db ? db.amount : null
        const provider = csv?.label ?? db?.label ?? key
        let status: ProviderMatchResult["status"]
        if (csvAmountUsd === null) status = "db_only"
        else if (dbAmountUsd === null) status = "csv_only"
        else if (Math.abs(csvAmountUsd - dbAmountUsd) > toleranceUsd) status = "amount_mismatch"
        else status = "matched"

        if (status === "matched") matchedCount++
        else driftCount++

        items.push({ provider, csvAmountUsd, dbAmountUsd, status })
    }

    return { matchedCount, driftCount, items }
}

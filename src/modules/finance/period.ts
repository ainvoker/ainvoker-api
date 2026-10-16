const PERIOD_RE = /^(\d{4})-(\d{2})$/

/** Validate `YYYY-MM` and return UTC half-open bounds `[start, end)`. */
export function parseFinancePeriod(period: string): { period: string; start: Date; end: Date } {
    const match = PERIOD_RE.exec(period)
    if (!match) {
        throw new Error(`Invalid period "${period}"; expected YYYY-MM`)
    }
    const year = Number(match[1])
    const month = Number(match[2])
    if (month < 1 || month > 12) {
        throw new Error(`Invalid period "${period}"; month must be 01–12`)
    }
    const start = new Date(Date.UTC(year, month - 1, 1))
    const end = new Date(Date.UTC(year, month, 1))
    return { period, start, end }
}

/** Current UTC calendar month as `YYYY-MM`. */
export function currentFinancePeriod(now = new Date()): string {
    const y = now.getUTCFullYear()
    const m = String(now.getUTCMonth() + 1).padStart(2, "0")
    return `${y}-${m}`
}

/**
 * Seeds demo AIRequest rows for dashboard charts (no real provider calls).
 *
 * Targets Todo App + Task Tracker under the TodoApp organization.
 * Range: 2026-09-01 → 2026-11-30 (UTC).
 *
 * Future-dated rows (Oct/Nov while still in Sep) are intentional so later
 * months have history; usage aggregates only count through end of today UTC,
 * so they do not inflate the current month's remaining/used totals.
 *
 * Idempotent: deletes prior rows tagged with `_seed: "usage-demo"` for those
 * projects, then inserts a fresh series.
 *
 * Usage: npm run seed:usage
 */
import prismaClient from "../src/platform/prisma.js"
import apiKeyHasher from "../src/platform/hash.js"
import { ensureTextCatalog } from "../src/modules/text/catalog.js"

const SEED_TAG = "usage-demo"
const YEAR = 2026
const RANGE_START = new Date(Date.UTC(YEAR, 8, 1, 0, 0, 0, 0)) // Sep 1
const RANGE_END = new Date(Date.UTC(YEAR, 10, 30, 23, 59, 59, 999)) // Nov 30

const TARGETS = [
    {
        id: "cmspgyvc000042ac2i6mw9liw",
        name: "Todo App",
        /** Relative traffic weight vs peers. */
        weight: 1.35,
    },
    {
        id: "cmu51ilsi0000e8wkqn4vht56",
        name: "Task Tracker",
        weight: 1,
    },
] as const

const ORG_NAME_HINTS = ["todoapp", "todo app", "TodoApp", "Todo App"]

type SeedModel = { id: number; name: string; providerName: string }

function daysInRange(start: Date, end: Date): Date[] {
    const days: Date[] = []
    let cursor = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
    )
    const last = new Date(
        Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
    )
    while (cursor.getTime() <= last.getTime()) {
        days.push(new Date(cursor))
        cursor = new Date(
            Date.UTC(
                cursor.getUTCFullYear(),
                cursor.getUTCMonth(),
                cursor.getUTCDate() + 1,
            ),
        )
    }
    return days
}

/** Deterministic pseudo-random in [0, 1) from a string key. */
function hash01(key: string): number {
    let h = 2166136261
    for (let i = 0; i < key.length; i++) {
        h ^= key.charCodeAt(i)
        h = Math.imul(h, 16777619)
    }
    return ((h >>> 0) % 10_000) / 10_000
}

function pick<T>(items: readonly T[], key: string): T {
    return items[Math.floor(hash01(key) * items.length) % items.length]!
}

function requestsForDay(day: Date, weight: number): number {
    const month = day.getUTCMonth()
    const dow = day.getUTCDay() // 0 Sun … 6 Sat
    const weekend = dow === 0 || dow === 6
    const base = weekend ? 4 : 14
    // Ramp through Q4 so Oct/Nov look busier than early Sep
    const monthBoost = month === 8 ? 0.85 : month === 9 ? 1.1 : 1.35
    const wobble = 0.55 + hash01(`${day.toISOString().slice(0, 10)}:vol`) * 0.9
    return Math.max(1, Math.round(base * monthBoost * weight * wobble))
}

async function resolveOrganizationId(): Promise<string | null> {
    for (const hint of ORG_NAME_HINTS) {
        const org = await prismaClient.organization.findFirst({
            where: { name: { equals: hint, mode: "insensitive" } },
            select: { id: true, name: true },
        })
        if (org) {
            console.log(`Organization: ${org.name} (${org.id})`)
            return org.id
        }
    }
    return null
}

async function resolveProject(
    organizationId: string | null,
    target: (typeof TARGETS)[number],
) {
    const byId = await prismaClient.project.findUnique({
        where: { id: target.id },
        select: {
            id: true,
            name: true,
            organizationId: true,
            organization: { select: { name: true } },
        },
    })
    if (byId) {
        console.log(`Project by id: ${byId.name} (${byId.id})`)
        return byId
    }

    if (!organizationId) return null

    const byName = await prismaClient.project.findFirst({
        where: {
            organizationId,
            name: { equals: target.name, mode: "insensitive" },
        },
        select: {
            id: true,
            name: true,
            organizationId: true,
            organization: { select: { name: true } },
        },
    })
    if (byName) {
        console.log(
            `Project by name (id changed after reset): ${byName.name} (${byName.id})`,
        )
        return byName
    }
    return null
}

async function ensureApiKey(projectId: string): Promise<string> {
    const existing = await prismaClient.apiKey.findFirst({
        where: { projectId, status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        select: { id: true },
    })
    if (existing) return existing.id

    const generated = apiKeyHasher.generate()
    const key = await prismaClient.apiKey.create({
        data: {
            projectId,
            keyName: "Usage demo key",
            keyHash: generated.keyHash,
            keyPrefix: generated.keyPrefix,
            status: "ACTIVE",
        },
        select: { id: true },
    })
    console.log(`Created API key for project ${projectId}`)
    return key.id
}

async function loadModels(): Promise<SeedModel[]> {
    await ensureTextCatalog()
    const models = await prismaClient.aIModel.findMany({
        where: { status: "ACTIVE" },
        select: {
            id: true,
            name: true,
            provider: { select: { name: true } },
        },
        take: 8,
    })
    if (models.length === 0) {
        throw new Error("No AI models in catalog — run npm run prisma:seed first")
    }
    return models.map((m) => ({
        id: m.id,
        name: m.name,
        providerName: m.provider.name,
    }))
}

function buildRows(args: {
    projectId: string
    apiKeyId: string
    weight: number
    models: SeedModel[]
    days: Date[]
}) {
    const rows: {
        projectId: string
        apiKeyId: string
        modelId: number
        serviceType: "TEXT"
        requestPayload: object
        responsePayload: object | null
        inputTokens: number
        outputTokens: number
        totalTokens: number
        latency: number | null
        requestCost: number | null
        requestStatus: "SUCCESS" | "FAILED"
        createdAt: Date
    }[] = []

    for (const day of args.days) {
        const dateKey = day.toISOString().slice(0, 10)
        const count = requestsForDay(day, args.weight)

        for (let i = 0; i < count; i++) {
            const key = `${args.projectId}:${dateKey}:${i}`
            const model = pick(args.models, `${key}:model`)
            const failed = hash01(`${key}:status`) < 0.08
            const hour = Math.floor(hash01(`${key}:hour`) * 24)
            const minute = Math.floor(hash01(`${key}:min`) * 60)
            const second = Math.floor(hash01(`${key}:sec`) * 60)
            const createdAt = new Date(
                Date.UTC(
                    day.getUTCFullYear(),
                    day.getUTCMonth(),
                    day.getUTCDate(),
                    hour,
                    minute,
                    second,
                ),
            )

            const inputTokens = 80 + Math.floor(hash01(`${key}:in`) * 420)
            const outputTokens = failed
                ? 0
                : 40 + Math.floor(hash01(`${key}:out`) * 380)
            const totalTokens = inputTokens + outputTokens
            const latency = failed
                ? null
                : 80 + Math.floor(hash01(`${key}:lat`) * 900)
            const slug = `${model.providerName}/${model.name}`

            rows.push({
                projectId: args.projectId,
                apiKeyId: args.apiKeyId,
                modelId: model.id,
                serviceType: "TEXT",
                requestPayload: {
                    _seed: SEED_TAG,
                    model: slug,
                    messages: [
                        {
                            role: "user",
                            content: `Demo prompt ${dateKey} #${i + 1}`,
                        },
                    ],
                },
                responsePayload: failed
                    ? null
                    : {
                          message: {
                              role: "assistant",
                              content: `Demo response ${dateKey} #${i + 1}`,
                          },
                      },
                inputTokens,
                outputTokens,
                totalTokens,
                latency,
                requestCost: failed ? null : Number((totalTokens * 0.000002).toFixed(6)),
                requestStatus: failed ? "FAILED" : "SUCCESS",
                createdAt,
            })
        }
    }

    return rows
}

async function clearPriorSeed(projectIds: string[]) {
    // Prisma JSON filter: path `_seed` equals SEED_TAG
    const result = await prismaClient.aIRequest.deleteMany({
        where: {
            projectId: { in: projectIds },
            createdAt: { gte: RANGE_START, lte: RANGE_END },
            requestPayload: {
                path: ["_seed"],
                equals: SEED_TAG,
            },
        },
    })
    console.log(`Removed ${result.count} prior seeded request(s)`)
}

async function insertBatched(
    rows: ReturnType<typeof buildRows>,
    batchSize = 500,
) {
    let inserted = 0
    for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize)
        const result = await prismaClient.aIRequest.createMany({ data: chunk })
        inserted += result.count
        process.stdout.write(`\rInserted ${inserted} / ${rows.length}`)
    }
    process.stdout.write("\n")
    return inserted
}

async function main() {
    console.log(
        `Seeding AI requests ${RANGE_START.toISOString().slice(0, 10)} → ${RANGE_END.toISOString().slice(0, 10)}`,
    )

    const organizationId = await resolveOrganizationId()
    const models = await loadModels()
    const days = daysInRange(RANGE_START, RANGE_END)

    const resolved: {
        id: string
        name: string
        weight: number
        apiKeyId: string
    }[] = []

    for (const target of TARGETS) {
        const project = await resolveProject(organizationId, target)
        if (!project) {
            console.warn(
                `⚠ Skipping "${target.name}" — not found by id ${target.id}` +
                    (organizationId ? " or name in org" : " (and no TodoApp org)"),
            )
            continue
        }
        const apiKeyId = await ensureApiKey(project.id)
        resolved.push({
            id: project.id,
            name: project.name,
            weight: target.weight,
            apiKeyId,
        })
    }

    if (resolved.length === 0) {
        throw new Error(
            "No target projects found. Recreate Todo App / Task Tracker (or restore DB), then re-run.",
        )
    }

    await clearPriorSeed(resolved.map((p) => p.id))

    const allRows = resolved.flatMap((project) =>
        buildRows({
            projectId: project.id,
            apiKeyId: project.apiKeyId,
            weight: project.weight,
            models,
            days,
        }),
    )

    console.log(
        `Creating ${allRows.length} request(s) across ${resolved.length} project(s)…`,
    )
    const inserted = await insertBatched(allRows)

    console.log(`Done. Inserted ${inserted} AI requests.`)
    console.log(
        "Note: Oct/Nov rows exist for later months; current-month usage only counts through today UTC.",
    )
}

main()
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
    .finally(async () => {
        await prismaClient.$disconnect()
    })

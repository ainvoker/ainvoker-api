import request from "supertest"
import { describe, expect, it } from "vitest"
import app from "../../src/app.js"

describe("health endpoints", () => {
    it("GET / returns API message", async () => {
        const res = await request(app.express).get("/")
        expect(res.status).toBe(200)
        expect(res.body).toEqual({ message: "AInvoker API" })
    })

    it("GET /health returns ok", async () => {
        const res = await request(app.express).get("/health")
        expect(res.status).toBe(200)
        expect(res.body).toEqual({ status: "ok" })
    })
})

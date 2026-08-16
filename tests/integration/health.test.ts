import request from "supertest"
import { describe, expect, it } from "vitest"
import app from "../../src/app.js"
import env from "../../src/config/env.js"

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

    it("dashboard CORS reflects CORS_ORIGIN and not arbitrary origins", async () => {
        const dashboardOrigin = env.CORS_ORIGIN.split(",")[0]?.trim() || "http://localhost:5173"

        const allowed = await request(app.express)
            .options("/api/v1/organizations/demo/projects")
            .set({
                Origin: dashboardOrigin,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization",
            })

        expect(allowed.headers["access-control-allow-origin"]).toBe(dashboardOrigin)

        const denied = await request(app.express)
            .options("/api/v1/organizations/demo/projects")
            .set({
                Origin: "https://random-customer.example.com",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization",
            })

        expect(denied.headers["access-control-allow-origin"]).toBeUndefined()
    })
})

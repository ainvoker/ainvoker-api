import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { ZodError, z } from "zod";
import errorHandler, { AppError } from "../../src/platform/errors.js";

function mockRes() {
    const res = {
        statusCode: 200,
        body: undefined as unknown,
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        json(payload: unknown) {
            this.body = payload;
            return this;
        },
    };
    return res as typeof res & Response;
}

describe("AppError", () => {
    it("stores status, code, and message", () => {
        const err = new AppError(404, "NOT_FOUND", "Missing");
        expect(err.status).toBe(404);
        expect(err.code).toBe("NOT_FOUND");
        expect(err.message).toBe("Missing");
        expect(err.name).toBe("AppError");
    });
});

describe("errorHandler", () => {
    const req = {} as Request;
    const next = vi.fn() as unknown as NextFunction;

    it("serializes AppError", () => {
        const res = mockRes();
        errorHandler(new AppError(401, "UNAUTHORIZED", "Nope"), req, res, next);
        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({
            error: { code: "UNAUTHORIZED", message: "Nope" },
        });
    });

    it("serializes ZodError as VALIDATION_ERROR", () => {
        const res = mockRes();
        let zodErr: ZodError;
        try {
            z.object({ name: z.string().min(1) }).parse({ name: "" });
            throw new Error("expected zod failure");
        } catch (err) {
            zodErr = err as ZodError;
        }
        errorHandler(zodErr!, req, res, next);
        expect(res.statusCode).toBe(400);
        expect((res.body as { error: { code: string } }).error.code).toBe("VALIDATION_ERROR");
    });

    it("serializes unknown errors as INTERNAL_ERROR", () => {
        const res = mockRes();
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        errorHandler(new Error("boom"), req, res, next);
        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({
            error: { code: "INTERNAL_ERROR", message: "Internal server error" },
        });
        spy.mockRestore();
    });
});

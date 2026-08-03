import type { NextFunction, Request, Response } from "express"
import { ZodError } from "zod"

export class AppError extends Error {
    readonly status: number
    readonly code: string

    constructor(status: number, code: string, message: string) {
        super(message)
        this.name = "AppError"
        this.status = status
        this.code = code
    }
}

class ErrorHandler {
    constructor() {
        this.handle = this.handle.bind(this)
    }

    handle(err: unknown, _req: Request, res: Response, _next: NextFunction) {
        if (err instanceof AppError) {
            res.status(err.status).json({
                error: { code: err.code, message: err.message },
            })
            return
        }

        if (err instanceof ZodError) {
            res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: err.issues.map((issue) => issue.message).join(" "),
                },
            })
            return
        }

        console.error(err)
        res.status(500).json({
            error: { code: "INTERNAL_ERROR", message: "Internal server error" },
        })
    }
}

export default new ErrorHandler().handle

import { ZodError } from "zod";
export class AppError extends Error {
    status;
    code;
    constructor(status, code, message) {
        super(message);
        this.name = "AppError";
        this.status = status;
        this.code = code;
    }
}
export function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError) {
        res.status(err.status).json({
            error: { code: err.code, message: err.message },
        });
        return;
    }
    if (err instanceof ZodError) {
        res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: err.issues.map((issue) => issue.message).join("; "),
            },
        });
        return;
    }
    console.error(err);
    res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
}
//# sourceMappingURL=errors.js.map
import type { NextFunction, Request, Response } from "express";
export declare class AppError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(status: number, code: string, message: string);
}
export declare function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=errors.d.ts.map
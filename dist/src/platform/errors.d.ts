import type { NextFunction, Request, Response } from "express";
export declare class AppError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(status: number, code: string, message: string);
}
declare const _default: (err: unknown, _req: Request, res: Response, _next: NextFunction) => void;
export default _default;
//# sourceMappingURL=errors.d.ts.map
import type { NextFunction, Request, RequestHandler, Response } from "express";
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
export declare function asyncHandler(fn: AsyncRequestHandler): RequestHandler;
export declare function ok<T>(res: Response, data: T, status?: number): void;
export {};
//# sourceMappingURL=http.d.ts.map
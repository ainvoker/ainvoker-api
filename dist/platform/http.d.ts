import type { NextFunction, Request, RequestHandler, Response } from "express";
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
declare class Http {
    asyncHandler(fn: AsyncRequestHandler): RequestHandler;
    ok<T>(res: Response, data: T, status?: number): void;
}
declare const _default: Http;
export default _default;
//# sourceMappingURL=http.d.ts.map
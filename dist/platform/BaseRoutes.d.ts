import type { Request, RequestHandler, Response } from "express";
export declare abstract class BaseRoutes {
    protected requireAuth(req: Request): {
        userId: string;
    };
    protected bind(handler: (req: Request, res: Response) => Promise<void>): RequestHandler;
}
//# sourceMappingURL=BaseRoutes.d.ts.map
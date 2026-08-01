import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

class Http {
    asyncHandler(fn: AsyncRequestHandler): RequestHandler {
        return (req, res, next) => {
            void fn(req, res, next).catch(next);
        };
    }

    ok<T>(res: Response, data: T, status = 200) {
        res.status(status).json({ data });
    }
}

export default new Http();

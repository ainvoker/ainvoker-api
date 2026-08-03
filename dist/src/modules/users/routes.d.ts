import { BaseRoutes } from "../../platform/BaseRoutes.js";
declare class UsersRoutes extends BaseRoutes {
    readonly router: import("express-serve-static-core").Router;
    constructor();
    private getMe;
    /** Create app User + default Personal org (idempotent). Seeds profile on first create. */
    private bootstrapMe;
    private updateMe;
}
declare const _default: UsersRoutes;
export default _default;
//# sourceMappingURL=routes.d.ts.map
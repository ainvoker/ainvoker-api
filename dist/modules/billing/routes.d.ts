import { BaseRoutes } from "../../platform/BaseRoutes.js";
declare class BillingRoutes extends BaseRoutes {
    readonly router: import("express-serve-static-core").Router;
    constructor();
    private getSubscription;
    private createCheckoutSession;
    private xenditWebhook;
}
declare const _default: BillingRoutes;
export default _default;
//# sourceMappingURL=routes.d.ts.map
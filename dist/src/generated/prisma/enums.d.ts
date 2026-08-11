export declare const OrganizationStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly SUSPENDED: "SUSPENDED";
    readonly DELETED: "DELETED";
};
export type OrganizationStatus = (typeof OrganizationStatus)[keyof typeof OrganizationStatus];
export declare const ProjectEnvironment: {
    readonly DEVELOPMENT: "DEVELOPMENT";
    readonly STAGING: "STAGING";
    readonly PRODUCTION: "PRODUCTION";
};
export type ProjectEnvironment = (typeof ProjectEnvironment)[keyof typeof ProjectEnvironment];
export declare const ProjectStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly ARCHIVED: "ARCHIVED";
    readonly DISABLED: "DISABLED";
};
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];
export declare const ApiKeyStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly REVOKED: "REVOKED";
    readonly EXPIRED: "EXPIRED";
};
export type ApiKeyStatus = (typeof ApiKeyStatus)[keyof typeof ApiKeyStatus];
export declare const CatalogStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly INACTIVE: "INACTIVE";
    readonly DEPRECATED: "DEPRECATED";
};
export type CatalogStatus = (typeof CatalogStatus)[keyof typeof CatalogStatus];
export declare const AIModelType: {
    readonly TEXT: "TEXT";
    readonly IMAGE: "IMAGE";
    readonly AUDIO: "AUDIO";
    readonly MULTIMODAL: "MULTIMODAL";
    readonly EMBEDDING: "EMBEDDING";
    readonly OTHER: "OTHER";
};
export type AIModelType = (typeof AIModelType)[keyof typeof AIModelType];
export declare const AIServiceType: {
    readonly TEXT: "TEXT";
    readonly IMAGE: "IMAGE";
    readonly ACTION: "ACTION";
};
export type AIServiceType = (typeof AIServiceType)[keyof typeof AIServiceType];
export declare const AIRequestStatus: {
    readonly PENDING: "PENDING";
    readonly SUCCESS: "SUCCESS";
    readonly FAILED: "FAILED";
    readonly REJECTED: "REJECTED";
};
export type AIRequestStatus = (typeof AIRequestStatus)[keyof typeof AIRequestStatus];
export declare const ActionInvocationStatus: {
    readonly REQUESTED: "REQUESTED";
    readonly REPORTED_SUCCESS: "REPORTED_SUCCESS";
    readonly REPORTED_FAILURE: "REPORTED_FAILURE";
};
export type ActionInvocationStatus = (typeof ActionInvocationStatus)[keyof typeof ActionInvocationStatus];
export declare const WebhookEvent: {
    readonly REQUEST_FAILED: "REQUEST_FAILED";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly USAGE_ALERT: "USAGE_ALERT";
};
export type WebhookEvent = (typeof WebhookEvent)[keyof typeof WebhookEvent];
export declare const WebhookStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly DISABLED: "DISABLED";
};
export type WebhookStatus = (typeof WebhookStatus)[keyof typeof WebhookStatus];
export declare const SubscriptionStatus: {
    readonly PENDING: "PENDING";
    readonly ACTIVE: "ACTIVE";
    readonly PAST_DUE: "PAST_DUE";
    readonly CANCELED: "CANCELED";
    readonly EXPIRED: "EXPIRED";
};
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
export declare const PlanBillingMode: {
    readonly FIXED_MONTHLY: "FIXED_MONTHLY";
    readonly METERED: "METERED";
};
export type PlanBillingMode = (typeof PlanBillingMode)[keyof typeof PlanBillingMode];
export declare const PaymentStatus: {
    readonly PENDING: "PENDING";
    readonly SUCCEEDED: "SUCCEEDED";
    readonly FAILED: "FAILED";
    readonly REFUNDED: "REFUNDED";
};
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
export declare const ThemePreference: {
    readonly LIGHT: "LIGHT";
    readonly DARK: "DARK";
    readonly DEVICE: "DEVICE";
};
export type ThemePreference = (typeof ThemePreference)[keyof typeof ThemePreference];
//# sourceMappingURL=enums.d.ts.map
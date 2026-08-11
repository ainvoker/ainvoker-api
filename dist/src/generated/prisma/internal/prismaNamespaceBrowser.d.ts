import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models.js';
export type * from './prismaNamespace.js';
export declare const Decimal: typeof runtime.Decimal;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
/**
 * Helper for filtering JSON entries that have `null` on the database (empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const DbNull: import("@prisma/client-runtime-utils").DbNullClass;
/**
 * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
/**
 * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
export declare const ModelName: {
    readonly User: "User";
    readonly Role: "Role";
    readonly Organization: "Organization";
    readonly OrganizationMember: "OrganizationMember";
    readonly Project: "Project";
    readonly ApiKey: "ApiKey";
    readonly AIProvider: "AIProvider";
    readonly AIModel: "AIModel";
    readonly AIRequest: "AIRequest";
    readonly Action: "Action";
    readonly ActionInvocation: "ActionInvocation";
    readonly UsageAnalytics: "UsageAnalytics";
    readonly Webhook: "Webhook";
    readonly Plan: "Plan";
    readonly Subscription: "Subscription";
    readonly Transaction: "Transaction";
    readonly ActivityLog: "ActivityLog";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const UserScalarFieldEnum: {
    readonly id: "id";
    readonly email: "email";
    readonly firstName: "firstName";
    readonly lastName: "lastName";
    readonly profilePicture: "profilePicture";
    readonly themePreference: "themePreference";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];
export declare const RoleScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
};
export type RoleScalarFieldEnum = (typeof RoleScalarFieldEnum)[keyof typeof RoleScalarFieldEnum];
export declare const OrganizationScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly slug: "slug";
    readonly status: "status";
    readonly createdByUserId: "createdByUserId";
    readonly xenditCustomerReference: "xenditCustomerReference";
    readonly xenditPaymentTokenId: "xenditPaymentTokenId";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type OrganizationScalarFieldEnum = (typeof OrganizationScalarFieldEnum)[keyof typeof OrganizationScalarFieldEnum];
export declare const OrganizationMemberScalarFieldEnum: {
    readonly id: "id";
    readonly organizationId: "organizationId";
    readonly userId: "userId";
    readonly roleId: "roleId";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type OrganizationMemberScalarFieldEnum = (typeof OrganizationMemberScalarFieldEnum)[keyof typeof OrganizationMemberScalarFieldEnum];
export declare const ProjectScalarFieldEnum: {
    readonly id: "id";
    readonly organizationId: "organizationId";
    readonly name: "name";
    readonly description: "description";
    readonly environment: "environment";
    readonly status: "status";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type ProjectScalarFieldEnum = (typeof ProjectScalarFieldEnum)[keyof typeof ProjectScalarFieldEnum];
export declare const ApiKeyScalarFieldEnum: {
    readonly id: "id";
    readonly projectId: "projectId";
    readonly keyName: "keyName";
    readonly keyHash: "keyHash";
    readonly keyPrefix: "keyPrefix";
    readonly permissions: "permissions";
    readonly lastUsed: "lastUsed";
    readonly expiresAt: "expiresAt";
    readonly status: "status";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type ApiKeyScalarFieldEnum = (typeof ApiKeyScalarFieldEnum)[keyof typeof ApiKeyScalarFieldEnum];
export declare const AIProviderScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly baseUrl: "baseUrl";
    readonly documentation: "documentation";
    readonly status: "status";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type AIProviderScalarFieldEnum = (typeof AIProviderScalarFieldEnum)[keyof typeof AIProviderScalarFieldEnum];
export declare const AIModelScalarFieldEnum: {
    readonly id: "id";
    readonly providerId: "providerId";
    readonly name: "name";
    readonly type: "type";
    readonly contextWindow: "contextWindow";
    readonly inputPrice: "inputPrice";
    readonly outputPrice: "outputPrice";
    readonly status: "status";
    readonly freeEligible: "freeEligible";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type AIModelScalarFieldEnum = (typeof AIModelScalarFieldEnum)[keyof typeof AIModelScalarFieldEnum];
export declare const AIRequestScalarFieldEnum: {
    readonly id: "id";
    readonly projectId: "projectId";
    readonly apiKeyId: "apiKeyId";
    readonly modelId: "modelId";
    readonly serviceType: "serviceType";
    readonly requestPayload: "requestPayload";
    readonly responsePayload: "responsePayload";
    readonly inputTokens: "inputTokens";
    readonly outputTokens: "outputTokens";
    readonly totalTokens: "totalTokens";
    readonly latency: "latency";
    readonly requestCost: "requestCost";
    readonly requestStatus: "requestStatus";
    readonly createdAt: "createdAt";
};
export type AIRequestScalarFieldEnum = (typeof AIRequestScalarFieldEnum)[keyof typeof AIRequestScalarFieldEnum];
export declare const ActionScalarFieldEnum: {
    readonly id: "id";
    readonly projectId: "projectId";
    readonly name: "name";
    readonly description: "description";
    readonly inputSchema: "inputSchema";
    readonly outputSchema: "outputSchema";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type ActionScalarFieldEnum = (typeof ActionScalarFieldEnum)[keyof typeof ActionScalarFieldEnum];
export declare const ActionInvocationScalarFieldEnum: {
    readonly id: "id";
    readonly requestId: "requestId";
    readonly actionId: "actionId";
    readonly executionStatus: "executionStatus";
    readonly executionResult: "executionResult";
    readonly executedAt: "executedAt";
};
export type ActionInvocationScalarFieldEnum = (typeof ActionInvocationScalarFieldEnum)[keyof typeof ActionInvocationScalarFieldEnum];
export declare const UsageAnalyticsScalarFieldEnum: {
    readonly id: "id";
    readonly projectId: "projectId";
    readonly totalRequests: "totalRequests";
    readonly successfulRequests: "successfulRequests";
    readonly failedRequests: "failedRequests";
    readonly totalTokens: "totalTokens";
    readonly totalCost: "totalCost";
    readonly month: "month";
    readonly year: "year";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type UsageAnalyticsScalarFieldEnum = (typeof UsageAnalyticsScalarFieldEnum)[keyof typeof UsageAnalyticsScalarFieldEnum];
export declare const WebhookScalarFieldEnum: {
    readonly id: "id";
    readonly projectId: "projectId";
    readonly webhookUrl: "webhookUrl";
    readonly secret: "secret";
    readonly event: "event";
    readonly status: "status";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type WebhookScalarFieldEnum = (typeof WebhookScalarFieldEnum)[keyof typeof WebhookScalarFieldEnum];
export declare const PlanScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly monthlyPrice: "monthlyPrice";
    readonly tokenLimit: "tokenLimit";
    readonly requestLimit: "requestLimit";
    readonly billingMode: "billingMode";
    readonly description: "description";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type PlanScalarFieldEnum = (typeof PlanScalarFieldEnum)[keyof typeof PlanScalarFieldEnum];
export declare const SubscriptionScalarFieldEnum: {
    readonly id: "id";
    readonly organizationId: "organizationId";
    readonly planId: "planId";
    readonly status: "status";
    readonly startedAt: "startedAt";
    readonly expiresAt: "expiresAt";
    readonly xenditSessionId: "xenditSessionId";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type SubscriptionScalarFieldEnum = (typeof SubscriptionScalarFieldEnum)[keyof typeof SubscriptionScalarFieldEnum];
export declare const TransactionScalarFieldEnum: {
    readonly id: "id";
    readonly subscriptionId: "subscriptionId";
    readonly amount: "amount";
    readonly paymentMethod: "paymentMethod";
    readonly referenceNumber: "referenceNumber";
    readonly paymentStatus: "paymentStatus";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type TransactionScalarFieldEnum = (typeof TransactionScalarFieldEnum)[keyof typeof TransactionScalarFieldEnum];
export declare const ActivityLogScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly activity: "activity";
    readonly ipAddress: "ipAddress";
    readonly browser: "browser";
    readonly device: "device";
    readonly createdAt: "createdAt";
};
export type ActivityLogScalarFieldEnum = (typeof ActivityLogScalarFieldEnum)[keyof typeof ActivityLogScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const NullableJsonNullValueInput: {
    readonly DbNull: import("@prisma/client-runtime-utils").DbNullClass;
    readonly JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
};
export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput];
export declare const JsonNullValueInput: {
    readonly JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
};
export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput];
export declare const QueryMode: {
    readonly default: "default";
    readonly insensitive: "insensitive";
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
export declare const NullsOrder: {
    readonly first: "first";
    readonly last: "last";
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
export declare const JsonNullValueFilter: {
    readonly DbNull: import("@prisma/client-runtime-utils").DbNullClass;
    readonly JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
    readonly AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
};
export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter];
//# sourceMappingURL=prismaNamespaceBrowser.d.ts.map
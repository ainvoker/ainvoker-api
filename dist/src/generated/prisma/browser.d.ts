import * as Prisma from './internal/prismaNamespaceBrowser.js';
export { Prisma };
export * as $Enums from './enums.js';
export * from './enums.js';
/**
 * Model User
 *
 */
export type User = Prisma.UserModel;
/**
 * Model Role
 * Membership roles: seed names `owner` | `admin` | `member`
 */
export type Role = Prisma.RoleModel;
/**
 * Model Organization
 *
 */
export type Organization = Prisma.OrganizationModel;
/**
 * Model OrganizationMember
 *
 */
export type OrganizationMember = Prisma.OrganizationMemberModel;
/**
 * Model Project
 *
 */
export type Project = Prisma.ProjectModel;
/**
 * Model ApiKey
 *
 */
export type ApiKey = Prisma.ApiKeyModel;
/**
 * Model AIProvider
 *
 */
export type AIProvider = Prisma.AIProviderModel;
/**
 * Model AIModel
 *
 */
export type AIModel = Prisma.AIModelModel;
/**
 * Model AIRequest
 *
 */
export type AIRequest = Prisma.AIRequestModel;
/**
 * Model Action
 * Registry-only action definition. Execution happens in the client/SDK.
 */
export type Action = Prisma.ActionModel;
/**
 * Model ActionInvocation
 * Audit of tool calls observed/reported during a gateway request (not server-side execution).
 */
export type ActionInvocation = Prisma.ActionInvocationModel;
/**
 * Model UsageAnalytics
 *
 */
export type UsageAnalytics = Prisma.UsageAnalyticsModel;
/**
 * Model Webhook
 *
 */
export type Webhook = Prisma.WebhookModel;
/**
 * Model Plan
 *
 */
export type Plan = Prisma.PlanModel;
/**
 * Model Subscription
 *
 */
export type Subscription = Prisma.SubscriptionModel;
/**
 * Model Transaction
 *
 */
export type Transaction = Prisma.TransactionModel;
/**
 * Model ActivityLog
 *
 */
export type ActivityLog = Prisma.ActivityLogModel;
//# sourceMappingURL=browser.d.ts.map
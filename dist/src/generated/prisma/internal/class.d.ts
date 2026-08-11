import * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "./prismaNamespace.js";
export type LogOptions<ClientOptions extends Prisma.PrismaClientOptions> = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never;
export interface PrismaClientConstructor {
    /**
   * ## Prisma Client
   *
   * Type-safe database client for TypeScript
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */
    new <Options extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions, LogOpts extends LogOptions<Options> = LogOptions<Options>, OmitOpts extends Prisma.PrismaClientOptions['omit'] = Options extends {
        omit: infer U;
    } ? U : Prisma.PrismaClientOptions['omit'], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs>(options: Prisma.Subset<Options, Prisma.PrismaClientOptions>): PrismaClient<LogOpts, OmitOpts, ExtArgs>;
}
/**
 * ## Prisma Client
 *
 * Type-safe database client for TypeScript
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export interface PrismaClient<in LogOpts extends Prisma.LogLevel = never, in out OmitOpts extends Prisma.PrismaClientOptions['omit'] = undefined, in out ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['other'];
    };
    $on<V extends LogOpts>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;
    /**
     * Connect with the database
     */
    $connect(): runtime.Types.Utils.JsPromise<void>;
    /**
     * Disconnect from the database
     */
    $disconnect(): runtime.Types.Utils.JsPromise<void>;
    /**
       * Executes a prepared raw query and returns the number of affected rows.
       * @example
       * ```
       * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
       * ```
       *
       * Read more in our [docs](https://pris.ly/d/raw-queries).
       */
    $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;
    /**
     * Executes a raw query and returns the number of affected rows.
     * Susceptible to SQL injections, see documentation.
     * @example
     * ```
     * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
     * ```
     *
     * Read more in our [docs](https://pris.ly/d/raw-queries).
     */
    $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;
    /**
     * Performs a prepared raw query and returns the `SELECT` data.
     * @example
     * ```
     * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
     * ```
     *
     * Read more in our [docs](https://pris.ly/d/raw-queries).
     */
    $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;
    /**
     * Performs a raw query and returns the `SELECT` data.
     * Susceptible to SQL injections, see documentation.
     * @example
     * ```
     * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
     * ```
     *
     * Read more in our [docs](https://pris.ly/d/raw-queries).
     */
    $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;
    /**
     * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
     * @example
     * ```
     * const [george, bob, alice] = await prisma.$transaction([
     *   prisma.user.create({ data: { name: 'George' } }),
     *   prisma.user.create({ data: { name: 'Bob' } }),
     *   prisma.user.create({ data: { name: 'Alice' } }),
     * ])
     * ```
     *
     * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
     */
    $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: Prisma.TransactionIsolationLevel;
    }): runtime.Types.Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>;
    $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => runtime.Types.Utils.JsPromise<R>, options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: Prisma.TransactionIsolationLevel;
    }): runtime.Types.Utils.JsPromise<R>;
    $extends: runtime.Types.Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<OmitOpts>, ExtArgs, runtime.Types.Utils.Call<Prisma.TypeMapCb<OmitOpts>, {
        extArgs: ExtArgs;
    }>>;
    /**
 * `prisma.user`: Exposes CRUD operations for the **User** model.
  * Example usage:
  * ```ts
  * // Fetch zero or more Users
  * const users = await prisma.user.findMany()
  * ```
  */
    get user(): Prisma.UserDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.role`: Exposes CRUD operations for the **Role** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Roles
      * const roles = await prisma.role.findMany()
      * ```
      */
    get role(): Prisma.RoleDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.organization`: Exposes CRUD operations for the **Organization** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Organizations
      * const organizations = await prisma.organization.findMany()
      * ```
      */
    get organization(): Prisma.OrganizationDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.organizationMember`: Exposes CRUD operations for the **OrganizationMember** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more OrganizationMembers
      * const organizationMembers = await prisma.organizationMember.findMany()
      * ```
      */
    get organizationMember(): Prisma.OrganizationMemberDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.project`: Exposes CRUD operations for the **Project** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Projects
      * const projects = await prisma.project.findMany()
      * ```
      */
    get project(): Prisma.ProjectDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.apiKey`: Exposes CRUD operations for the **ApiKey** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more ApiKeys
      * const apiKeys = await prisma.apiKey.findMany()
      * ```
      */
    get apiKey(): Prisma.ApiKeyDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.aIProvider`: Exposes CRUD operations for the **AIProvider** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more AIProviders
      * const aIProviders = await prisma.aIProvider.findMany()
      * ```
      */
    get aIProvider(): Prisma.AIProviderDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.aIModel`: Exposes CRUD operations for the **AIModel** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more AIModels
      * const aIModels = await prisma.aIModel.findMany()
      * ```
      */
    get aIModel(): Prisma.AIModelDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.aIRequest`: Exposes CRUD operations for the **AIRequest** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more AIRequests
      * const aIRequests = await prisma.aIRequest.findMany()
      * ```
      */
    get aIRequest(): Prisma.AIRequestDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.action`: Exposes CRUD operations for the **Action** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Actions
      * const actions = await prisma.action.findMany()
      * ```
      */
    get action(): Prisma.ActionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.actionInvocation`: Exposes CRUD operations for the **ActionInvocation** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more ActionInvocations
      * const actionInvocations = await prisma.actionInvocation.findMany()
      * ```
      */
    get actionInvocation(): Prisma.ActionInvocationDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.usageAnalytics`: Exposes CRUD operations for the **UsageAnalytics** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more UsageAnalytics
      * const usageAnalytics = await prisma.usageAnalytics.findMany()
      * ```
      */
    get usageAnalytics(): Prisma.UsageAnalyticsDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.webhook`: Exposes CRUD operations for the **Webhook** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Webhooks
      * const webhooks = await prisma.webhook.findMany()
      * ```
      */
    get webhook(): Prisma.WebhookDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.plan`: Exposes CRUD operations for the **Plan** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Plans
      * const plans = await prisma.plan.findMany()
      * ```
      */
    get plan(): Prisma.PlanDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.subscription`: Exposes CRUD operations for the **Subscription** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Subscriptions
      * const subscriptions = await prisma.subscription.findMany()
      * ```
      */
    get subscription(): Prisma.SubscriptionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.transaction`: Exposes CRUD operations for the **Transaction** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Transactions
      * const transactions = await prisma.transaction.findMany()
      * ```
      */
    get transaction(): Prisma.TransactionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.activityLog`: Exposes CRUD operations for the **ActivityLog** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more ActivityLogs
      * const activityLogs = await prisma.activityLog.findMany()
      * ```
      */
    get activityLog(): Prisma.ActivityLogDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
}
export declare function getPrismaClientClass(): PrismaClientConstructor;
//# sourceMappingURL=class.d.ts.map
import * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../models.js";
import { type PrismaClient } from "./class.js";
export type * from '../models.js';
export type DMMF = typeof runtime.DMMF;
export type PrismaPromise<T> = runtime.Types.Public.PrismaPromise<T>;
/**
 * Prisma Errors
 */
export declare const PrismaClientKnownRequestError: typeof runtime.PrismaClientKnownRequestError;
export type PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
export declare const PrismaClientUnknownRequestError: typeof runtime.PrismaClientUnknownRequestError;
export type PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
export declare const PrismaClientRustPanicError: typeof runtime.PrismaClientRustPanicError;
export type PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
export declare const PrismaClientInitializationError: typeof runtime.PrismaClientInitializationError;
export type PrismaClientInitializationError = runtime.PrismaClientInitializationError;
export declare const PrismaClientValidationError: typeof runtime.PrismaClientValidationError;
export type PrismaClientValidationError = runtime.PrismaClientValidationError;
/**
 * Re-export of sql-template-tag
 */
export declare const sql: typeof runtime.sqltag;
export declare const empty: runtime.Sql;
export declare const join: typeof runtime.join;
export declare const raw: typeof runtime.raw;
export declare const Sql: typeof runtime.Sql;
export type Sql = runtime.Sql;
/**
 * Decimal.js
 */
export declare const Decimal: typeof runtime.Decimal;
export type Decimal = runtime.Decimal;
export type DecimalJsLike = runtime.DecimalJsLike;
/**
* Extensions
*/
export type Extension = runtime.Types.Extensions.UserArgs;
export declare const getExtensionContext: typeof runtime.Extensions.getExtensionContext;
export type Args<T, F extends runtime.Operation> = runtime.Types.Public.Args<T, F>;
export type Payload<T, F extends runtime.Operation = never> = runtime.Types.Public.Payload<T, F>;
export type Result<T, A, F extends runtime.Operation> = runtime.Types.Public.Result<T, A, F>;
export type Exact<A, W> = runtime.Types.Public.Exact<A, W>;
export type PrismaVersion = {
    client: string;
    engine: string;
};
/**
 * Prisma Client JS version: 7.8.0
 * Query Engine version: 3c6e192761c0362d496ed980de936e2f3cebcd3a
 */
export declare const prismaVersion: PrismaVersion;
/**
 * Utility Types
 */
export type Bytes = runtime.Bytes;
export type JsonObject = runtime.JsonObject;
export type JsonArray = runtime.JsonArray;
export type JsonValue = runtime.JsonValue;
export type InputJsonObject = runtime.InputJsonObject;
export type InputJsonArray = runtime.InputJsonArray;
export type InputJsonValue = runtime.InputJsonValue;
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
export declare const DbNull: runtime.DbNullClass;
/**
 * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const JsonNull: runtime.JsonNullClass;
/**
 * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const AnyNull: runtime.AnyNullClass;
type SelectAndInclude = {
    select: any;
    include: any;
};
type SelectAndOmit = {
    select: any;
    omit: any;
};
/**
 * From T, pick a set of properties whose keys are in the union K
 */
type Prisma__Pick<T, K extends keyof T> = {
    [P in K]: T[P];
};
export type Enumerable<T> = T | Array<T>;
/**
 * Subset
 * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
 */
export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
};
/**
 * SelectSubset
 * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
 * Additionally, it validates, if both select and include are present. If the case, it errors.
 */
export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
} & (T extends SelectAndInclude ? 'Please either choose `select` or `include`.' : T extends SelectAndOmit ? 'Please either choose `select` or `omit`.' : {});
/**
 * Subset + Intersection
 * @desc From `T` pick properties that exist in `U` and intersect `K`
 */
export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
} & K;
type Without<T, U> = {
    [P in Exclude<keyof T, keyof U>]?: never;
};
/**
 * XOR is needed to have a real mutually exclusive union type
 * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
 */
export type XOR<T, U> = T extends object ? U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : U : T;
/**
 * Is T a Record?
 */
type IsObject<T extends any> = T extends Array<any> ? False : T extends Date ? False : T extends Uint8Array ? False : T extends BigInt ? False : T extends object ? True : False;
/**
 * If it's T[], return T
 */
export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T;
/**
 * From ts-toolbelt
 */
type __Either<O extends object, K extends Key> = Omit<O, K> & {
    [P in K]: Prisma__Pick<O, P & keyof O>;
}[K];
type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>;
type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>;
type _Either<O extends object, K extends Key, strict extends Boolean> = {
    1: EitherStrict<O, K>;
    0: EitherLoose<O, K>;
}[strict];
export type Either<O extends object, K extends Key, strict extends Boolean = 1> = O extends unknown ? _Either<O, K, strict> : never;
export type Union = any;
export type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K];
} & {};
/** Helper Types for "Merge" **/
export type IntersectOf<U extends Union> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
export type Overwrite<O extends object, O1 extends object> = {
    [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
} & {};
type _Merge<U extends object> = IntersectOf<Overwrite<U, {
    [K in keyof U]-?: At<U, K>;
}>>;
type Key = string | number | symbol;
type AtStrict<O extends object, K extends Key> = O[K & keyof O];
type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
    1: AtStrict<O, K>;
    0: AtLoose<O, K>;
}[strict];
export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
} & {};
export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
} & {};
type _Record<K extends keyof any, T> = {
    [P in K]: T;
};
type NoExpand<T> = T extends unknown ? T : never;
export type AtLeast<O extends object, K extends string> = NoExpand<O extends unknown ? (K extends keyof O ? {
    [P in K]: O[P];
} & O : O) | {
    [P in keyof O as P extends K ? P : never]-?: O[P];
} & O : never>;
type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;
export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
/** End Helper Types for "Merge" **/
export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;
export type Boolean = True | False;
export type True = 1;
export type False = 0;
export type Not<B extends Boolean> = {
    0: 1;
    1: 0;
}[B];
export type Extends<A1 extends any, A2 extends any> = [A1] extends [never] ? 0 : A1 extends A2 ? 1 : 0;
export type Has<U extends Union, U1 extends Union> = Not<Extends<Exclude<U1, U>, U1>>;
export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
        0: 0;
        1: 1;
    };
    1: {
        0: 1;
        1: 1;
    };
}[B1][B2];
export type Keys<U extends Union> = U extends unknown ? keyof U : never;
export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O ? O[P] : never;
} : never;
type FieldPaths<T, U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>> = IsObject<T> extends True ? U : T;
export type GetHavingFields<T> = {
    [K in keyof T]: Or<Or<Extends<'OR', K>, Extends<'AND', K>>, Extends<'NOT', K>> extends True ? T[K] extends infer TK ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never> : never : {} extends FieldPaths<T[K]> ? never : K;
}[keyof T];
/**
 * Convert tuple to union
 */
type _TupleToUnion<T> = T extends (infer E)[] ? E : never;
type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>;
export type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T;
/**
 * Like `Pick`, but additionally can also accept an array of keys
 */
export type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>;
/**
 * Exclude all keys with underscores
 */
export type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T;
export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>;
type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>;
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
export interface TypeMapCb<GlobalOmitOptions = {}> extends runtime.Types.Utils.Fn<{
    extArgs: runtime.Types.Extensions.InternalArgs;
}, runtime.Types.Utils.Record<string, any>> {
    returns: TypeMap<this['params']['extArgs'], GlobalOmitOptions>;
}
export type TypeMap<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
        omit: GlobalOmitOptions;
    };
    meta: {
        modelProps: "user" | "role" | "organization" | "organizationMember" | "project" | "apiKey" | "aIProvider" | "aIModel" | "aIRequest" | "action" | "actionInvocation" | "usageAnalytics" | "webhook" | "plan" | "subscription" | "transaction" | "activityLog";
        txIsolationLevel: TransactionIsolationLevel;
    };
    model: {
        User: {
            payload: Prisma.$UserPayload<ExtArgs>;
            fields: Prisma.UserFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.UserFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                findFirst: {
                    args: Prisma.UserFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                findMany: {
                    args: Prisma.UserFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>[];
                };
                create: {
                    args: Prisma.UserCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                createMany: {
                    args: Prisma.UserCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>[];
                };
                delete: {
                    args: Prisma.UserDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                update: {
                    args: Prisma.UserUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                deleteMany: {
                    args: Prisma.UserDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.UserUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>[];
                };
                upsert: {
                    args: Prisma.UserUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                aggregate: {
                    args: Prisma.UserAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateUser>;
                };
                groupBy: {
                    args: Prisma.UserGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UserGroupByOutputType>[];
                };
                count: {
                    args: Prisma.UserCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UserCountAggregateOutputType> | number;
                };
            };
        };
        Role: {
            payload: Prisma.$RolePayload<ExtArgs>;
            fields: Prisma.RoleFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.RoleFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.RoleFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>;
                };
                findFirst: {
                    args: Prisma.RoleFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.RoleFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>;
                };
                findMany: {
                    args: Prisma.RoleFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>[];
                };
                create: {
                    args: Prisma.RoleCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>;
                };
                createMany: {
                    args: Prisma.RoleCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.RoleCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>[];
                };
                delete: {
                    args: Prisma.RoleDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>;
                };
                update: {
                    args: Prisma.RoleUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>;
                };
                deleteMany: {
                    args: Prisma.RoleDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.RoleUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.RoleUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>[];
                };
                upsert: {
                    args: Prisma.RoleUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RolePayload>;
                };
                aggregate: {
                    args: Prisma.RoleAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateRole>;
                };
                groupBy: {
                    args: Prisma.RoleGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RoleGroupByOutputType>[];
                };
                count: {
                    args: Prisma.RoleCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RoleCountAggregateOutputType> | number;
                };
            };
        };
        Organization: {
            payload: Prisma.$OrganizationPayload<ExtArgs>;
            fields: Prisma.OrganizationFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.OrganizationFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.OrganizationFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationPayload>;
                };
                findFirst: {
                    args: Prisma.OrganizationFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.OrganizationFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationPayload>;
                };
                findMany: {
                    args: Prisma.OrganizationFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationPayload>[];
                };
                create: {
                    args: Prisma.OrganizationCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationPayload>;
                };
                createMany: {
                    args: Prisma.OrganizationCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.OrganizationCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationPayload>[];
                };
                delete: {
                    args: Prisma.OrganizationDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationPayload>;
                };
                update: {
                    args: Prisma.OrganizationUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationPayload>;
                };
                deleteMany: {
                    args: Prisma.OrganizationDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.OrganizationUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.OrganizationUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationPayload>[];
                };
                upsert: {
                    args: Prisma.OrganizationUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationPayload>;
                };
                aggregate: {
                    args: Prisma.OrganizationAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateOrganization>;
                };
                groupBy: {
                    args: Prisma.OrganizationGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.OrganizationGroupByOutputType>[];
                };
                count: {
                    args: Prisma.OrganizationCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.OrganizationCountAggregateOutputType> | number;
                };
            };
        };
        OrganizationMember: {
            payload: Prisma.$OrganizationMemberPayload<ExtArgs>;
            fields: Prisma.OrganizationMemberFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.OrganizationMemberFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationMemberPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.OrganizationMemberFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationMemberPayload>;
                };
                findFirst: {
                    args: Prisma.OrganizationMemberFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationMemberPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.OrganizationMemberFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationMemberPayload>;
                };
                findMany: {
                    args: Prisma.OrganizationMemberFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationMemberPayload>[];
                };
                create: {
                    args: Prisma.OrganizationMemberCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationMemberPayload>;
                };
                createMany: {
                    args: Prisma.OrganizationMemberCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.OrganizationMemberCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationMemberPayload>[];
                };
                delete: {
                    args: Prisma.OrganizationMemberDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationMemberPayload>;
                };
                update: {
                    args: Prisma.OrganizationMemberUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationMemberPayload>;
                };
                deleteMany: {
                    args: Prisma.OrganizationMemberDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.OrganizationMemberUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.OrganizationMemberUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationMemberPayload>[];
                };
                upsert: {
                    args: Prisma.OrganizationMemberUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$OrganizationMemberPayload>;
                };
                aggregate: {
                    args: Prisma.OrganizationMemberAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateOrganizationMember>;
                };
                groupBy: {
                    args: Prisma.OrganizationMemberGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.OrganizationMemberGroupByOutputType>[];
                };
                count: {
                    args: Prisma.OrganizationMemberCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.OrganizationMemberCountAggregateOutputType> | number;
                };
            };
        };
        Project: {
            payload: Prisma.$ProjectPayload<ExtArgs>;
            fields: Prisma.ProjectFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ProjectFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProjectPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ProjectFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProjectPayload>;
                };
                findFirst: {
                    args: Prisma.ProjectFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProjectPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ProjectFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProjectPayload>;
                };
                findMany: {
                    args: Prisma.ProjectFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProjectPayload>[];
                };
                create: {
                    args: Prisma.ProjectCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProjectPayload>;
                };
                createMany: {
                    args: Prisma.ProjectCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ProjectCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProjectPayload>[];
                };
                delete: {
                    args: Prisma.ProjectDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProjectPayload>;
                };
                update: {
                    args: Prisma.ProjectUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProjectPayload>;
                };
                deleteMany: {
                    args: Prisma.ProjectDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ProjectUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ProjectUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProjectPayload>[];
                };
                upsert: {
                    args: Prisma.ProjectUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProjectPayload>;
                };
                aggregate: {
                    args: Prisma.ProjectAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateProject>;
                };
                groupBy: {
                    args: Prisma.ProjectGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ProjectGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ProjectCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ProjectCountAggregateOutputType> | number;
                };
            };
        };
        ApiKey: {
            payload: Prisma.$ApiKeyPayload<ExtArgs>;
            fields: Prisma.ApiKeyFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ApiKeyFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApiKeyPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ApiKeyFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApiKeyPayload>;
                };
                findFirst: {
                    args: Prisma.ApiKeyFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApiKeyPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ApiKeyFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApiKeyPayload>;
                };
                findMany: {
                    args: Prisma.ApiKeyFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApiKeyPayload>[];
                };
                create: {
                    args: Prisma.ApiKeyCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApiKeyPayload>;
                };
                createMany: {
                    args: Prisma.ApiKeyCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ApiKeyCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApiKeyPayload>[];
                };
                delete: {
                    args: Prisma.ApiKeyDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApiKeyPayload>;
                };
                update: {
                    args: Prisma.ApiKeyUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApiKeyPayload>;
                };
                deleteMany: {
                    args: Prisma.ApiKeyDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ApiKeyUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ApiKeyUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApiKeyPayload>[];
                };
                upsert: {
                    args: Prisma.ApiKeyUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ApiKeyPayload>;
                };
                aggregate: {
                    args: Prisma.ApiKeyAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateApiKey>;
                };
                groupBy: {
                    args: Prisma.ApiKeyGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ApiKeyGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ApiKeyCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ApiKeyCountAggregateOutputType> | number;
                };
            };
        };
        AIProvider: {
            payload: Prisma.$AIProviderPayload<ExtArgs>;
            fields: Prisma.AIProviderFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.AIProviderFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIProviderPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.AIProviderFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIProviderPayload>;
                };
                findFirst: {
                    args: Prisma.AIProviderFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIProviderPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.AIProviderFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIProviderPayload>;
                };
                findMany: {
                    args: Prisma.AIProviderFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIProviderPayload>[];
                };
                create: {
                    args: Prisma.AIProviderCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIProviderPayload>;
                };
                createMany: {
                    args: Prisma.AIProviderCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.AIProviderCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIProviderPayload>[];
                };
                delete: {
                    args: Prisma.AIProviderDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIProviderPayload>;
                };
                update: {
                    args: Prisma.AIProviderUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIProviderPayload>;
                };
                deleteMany: {
                    args: Prisma.AIProviderDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.AIProviderUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.AIProviderUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIProviderPayload>[];
                };
                upsert: {
                    args: Prisma.AIProviderUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIProviderPayload>;
                };
                aggregate: {
                    args: Prisma.AIProviderAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateAIProvider>;
                };
                groupBy: {
                    args: Prisma.AIProviderGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AIProviderGroupByOutputType>[];
                };
                count: {
                    args: Prisma.AIProviderCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AIProviderCountAggregateOutputType> | number;
                };
            };
        };
        AIModel: {
            payload: Prisma.$AIModelPayload<ExtArgs>;
            fields: Prisma.AIModelFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.AIModelFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIModelPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.AIModelFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIModelPayload>;
                };
                findFirst: {
                    args: Prisma.AIModelFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIModelPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.AIModelFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIModelPayload>;
                };
                findMany: {
                    args: Prisma.AIModelFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIModelPayload>[];
                };
                create: {
                    args: Prisma.AIModelCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIModelPayload>;
                };
                createMany: {
                    args: Prisma.AIModelCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.AIModelCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIModelPayload>[];
                };
                delete: {
                    args: Prisma.AIModelDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIModelPayload>;
                };
                update: {
                    args: Prisma.AIModelUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIModelPayload>;
                };
                deleteMany: {
                    args: Prisma.AIModelDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.AIModelUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.AIModelUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIModelPayload>[];
                };
                upsert: {
                    args: Prisma.AIModelUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIModelPayload>;
                };
                aggregate: {
                    args: Prisma.AIModelAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateAIModel>;
                };
                groupBy: {
                    args: Prisma.AIModelGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AIModelGroupByOutputType>[];
                };
                count: {
                    args: Prisma.AIModelCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AIModelCountAggregateOutputType> | number;
                };
            };
        };
        AIRequest: {
            payload: Prisma.$AIRequestPayload<ExtArgs>;
            fields: Prisma.AIRequestFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.AIRequestFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIRequestPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.AIRequestFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIRequestPayload>;
                };
                findFirst: {
                    args: Prisma.AIRequestFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIRequestPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.AIRequestFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIRequestPayload>;
                };
                findMany: {
                    args: Prisma.AIRequestFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIRequestPayload>[];
                };
                create: {
                    args: Prisma.AIRequestCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIRequestPayload>;
                };
                createMany: {
                    args: Prisma.AIRequestCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.AIRequestCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIRequestPayload>[];
                };
                delete: {
                    args: Prisma.AIRequestDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIRequestPayload>;
                };
                update: {
                    args: Prisma.AIRequestUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIRequestPayload>;
                };
                deleteMany: {
                    args: Prisma.AIRequestDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.AIRequestUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.AIRequestUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIRequestPayload>[];
                };
                upsert: {
                    args: Prisma.AIRequestUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AIRequestPayload>;
                };
                aggregate: {
                    args: Prisma.AIRequestAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateAIRequest>;
                };
                groupBy: {
                    args: Prisma.AIRequestGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AIRequestGroupByOutputType>[];
                };
                count: {
                    args: Prisma.AIRequestCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AIRequestCountAggregateOutputType> | number;
                };
            };
        };
        Action: {
            payload: Prisma.$ActionPayload<ExtArgs>;
            fields: Prisma.ActionFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ActionFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ActionFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionPayload>;
                };
                findFirst: {
                    args: Prisma.ActionFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ActionFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionPayload>;
                };
                findMany: {
                    args: Prisma.ActionFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionPayload>[];
                };
                create: {
                    args: Prisma.ActionCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionPayload>;
                };
                createMany: {
                    args: Prisma.ActionCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ActionCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionPayload>[];
                };
                delete: {
                    args: Prisma.ActionDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionPayload>;
                };
                update: {
                    args: Prisma.ActionUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionPayload>;
                };
                deleteMany: {
                    args: Prisma.ActionDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ActionUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ActionUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionPayload>[];
                };
                upsert: {
                    args: Prisma.ActionUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionPayload>;
                };
                aggregate: {
                    args: Prisma.ActionAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateAction>;
                };
                groupBy: {
                    args: Prisma.ActionGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ActionGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ActionCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ActionCountAggregateOutputType> | number;
                };
            };
        };
        ActionInvocation: {
            payload: Prisma.$ActionInvocationPayload<ExtArgs>;
            fields: Prisma.ActionInvocationFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ActionInvocationFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionInvocationPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ActionInvocationFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionInvocationPayload>;
                };
                findFirst: {
                    args: Prisma.ActionInvocationFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionInvocationPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ActionInvocationFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionInvocationPayload>;
                };
                findMany: {
                    args: Prisma.ActionInvocationFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionInvocationPayload>[];
                };
                create: {
                    args: Prisma.ActionInvocationCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionInvocationPayload>;
                };
                createMany: {
                    args: Prisma.ActionInvocationCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ActionInvocationCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionInvocationPayload>[];
                };
                delete: {
                    args: Prisma.ActionInvocationDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionInvocationPayload>;
                };
                update: {
                    args: Prisma.ActionInvocationUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionInvocationPayload>;
                };
                deleteMany: {
                    args: Prisma.ActionInvocationDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ActionInvocationUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ActionInvocationUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionInvocationPayload>[];
                };
                upsert: {
                    args: Prisma.ActionInvocationUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActionInvocationPayload>;
                };
                aggregate: {
                    args: Prisma.ActionInvocationAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateActionInvocation>;
                };
                groupBy: {
                    args: Prisma.ActionInvocationGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ActionInvocationGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ActionInvocationCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ActionInvocationCountAggregateOutputType> | number;
                };
            };
        };
        UsageAnalytics: {
            payload: Prisma.$UsageAnalyticsPayload<ExtArgs>;
            fields: Prisma.UsageAnalyticsFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.UsageAnalyticsFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UsageAnalyticsPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.UsageAnalyticsFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UsageAnalyticsPayload>;
                };
                findFirst: {
                    args: Prisma.UsageAnalyticsFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UsageAnalyticsPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.UsageAnalyticsFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UsageAnalyticsPayload>;
                };
                findMany: {
                    args: Prisma.UsageAnalyticsFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UsageAnalyticsPayload>[];
                };
                create: {
                    args: Prisma.UsageAnalyticsCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UsageAnalyticsPayload>;
                };
                createMany: {
                    args: Prisma.UsageAnalyticsCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.UsageAnalyticsCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UsageAnalyticsPayload>[];
                };
                delete: {
                    args: Prisma.UsageAnalyticsDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UsageAnalyticsPayload>;
                };
                update: {
                    args: Prisma.UsageAnalyticsUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UsageAnalyticsPayload>;
                };
                deleteMany: {
                    args: Prisma.UsageAnalyticsDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.UsageAnalyticsUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.UsageAnalyticsUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UsageAnalyticsPayload>[];
                };
                upsert: {
                    args: Prisma.UsageAnalyticsUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UsageAnalyticsPayload>;
                };
                aggregate: {
                    args: Prisma.UsageAnalyticsAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateUsageAnalytics>;
                };
                groupBy: {
                    args: Prisma.UsageAnalyticsGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UsageAnalyticsGroupByOutputType>[];
                };
                count: {
                    args: Prisma.UsageAnalyticsCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UsageAnalyticsCountAggregateOutputType> | number;
                };
            };
        };
        Webhook: {
            payload: Prisma.$WebhookPayload<ExtArgs>;
            fields: Prisma.WebhookFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.WebhookFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WebhookPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.WebhookFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WebhookPayload>;
                };
                findFirst: {
                    args: Prisma.WebhookFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WebhookPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.WebhookFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WebhookPayload>;
                };
                findMany: {
                    args: Prisma.WebhookFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WebhookPayload>[];
                };
                create: {
                    args: Prisma.WebhookCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WebhookPayload>;
                };
                createMany: {
                    args: Prisma.WebhookCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.WebhookCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WebhookPayload>[];
                };
                delete: {
                    args: Prisma.WebhookDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WebhookPayload>;
                };
                update: {
                    args: Prisma.WebhookUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WebhookPayload>;
                };
                deleteMany: {
                    args: Prisma.WebhookDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.WebhookUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.WebhookUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WebhookPayload>[];
                };
                upsert: {
                    args: Prisma.WebhookUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WebhookPayload>;
                };
                aggregate: {
                    args: Prisma.WebhookAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateWebhook>;
                };
                groupBy: {
                    args: Prisma.WebhookGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.WebhookGroupByOutputType>[];
                };
                count: {
                    args: Prisma.WebhookCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.WebhookCountAggregateOutputType> | number;
                };
            };
        };
        Plan: {
            payload: Prisma.$PlanPayload<ExtArgs>;
            fields: Prisma.PlanFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.PlanFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PlanPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.PlanFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PlanPayload>;
                };
                findFirst: {
                    args: Prisma.PlanFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PlanPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.PlanFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PlanPayload>;
                };
                findMany: {
                    args: Prisma.PlanFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PlanPayload>[];
                };
                create: {
                    args: Prisma.PlanCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PlanPayload>;
                };
                createMany: {
                    args: Prisma.PlanCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.PlanCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PlanPayload>[];
                };
                delete: {
                    args: Prisma.PlanDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PlanPayload>;
                };
                update: {
                    args: Prisma.PlanUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PlanPayload>;
                };
                deleteMany: {
                    args: Prisma.PlanDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.PlanUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.PlanUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PlanPayload>[];
                };
                upsert: {
                    args: Prisma.PlanUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PlanPayload>;
                };
                aggregate: {
                    args: Prisma.PlanAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregatePlan>;
                };
                groupBy: {
                    args: Prisma.PlanGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PlanGroupByOutputType>[];
                };
                count: {
                    args: Prisma.PlanCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PlanCountAggregateOutputType> | number;
                };
            };
        };
        Subscription: {
            payload: Prisma.$SubscriptionPayload<ExtArgs>;
            fields: Prisma.SubscriptionFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.SubscriptionFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.SubscriptionFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload>;
                };
                findFirst: {
                    args: Prisma.SubscriptionFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.SubscriptionFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload>;
                };
                findMany: {
                    args: Prisma.SubscriptionFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload>[];
                };
                create: {
                    args: Prisma.SubscriptionCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload>;
                };
                createMany: {
                    args: Prisma.SubscriptionCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.SubscriptionCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload>[];
                };
                delete: {
                    args: Prisma.SubscriptionDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload>;
                };
                update: {
                    args: Prisma.SubscriptionUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload>;
                };
                deleteMany: {
                    args: Prisma.SubscriptionDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.SubscriptionUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.SubscriptionUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload>[];
                };
                upsert: {
                    args: Prisma.SubscriptionUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload>;
                };
                aggregate: {
                    args: Prisma.SubscriptionAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateSubscription>;
                };
                groupBy: {
                    args: Prisma.SubscriptionGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SubscriptionGroupByOutputType>[];
                };
                count: {
                    args: Prisma.SubscriptionCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SubscriptionCountAggregateOutputType> | number;
                };
            };
        };
        Transaction: {
            payload: Prisma.$TransactionPayload<ExtArgs>;
            fields: Prisma.TransactionFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.TransactionFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.TransactionFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload>;
                };
                findFirst: {
                    args: Prisma.TransactionFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.TransactionFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload>;
                };
                findMany: {
                    args: Prisma.TransactionFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload>[];
                };
                create: {
                    args: Prisma.TransactionCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload>;
                };
                createMany: {
                    args: Prisma.TransactionCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.TransactionCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload>[];
                };
                delete: {
                    args: Prisma.TransactionDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload>;
                };
                update: {
                    args: Prisma.TransactionUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload>;
                };
                deleteMany: {
                    args: Prisma.TransactionDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.TransactionUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.TransactionUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload>[];
                };
                upsert: {
                    args: Prisma.TransactionUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload>;
                };
                aggregate: {
                    args: Prisma.TransactionAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateTransaction>;
                };
                groupBy: {
                    args: Prisma.TransactionGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TransactionGroupByOutputType>[];
                };
                count: {
                    args: Prisma.TransactionCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TransactionCountAggregateOutputType> | number;
                };
            };
        };
        ActivityLog: {
            payload: Prisma.$ActivityLogPayload<ExtArgs>;
            fields: Prisma.ActivityLogFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ActivityLogFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActivityLogPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ActivityLogFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActivityLogPayload>;
                };
                findFirst: {
                    args: Prisma.ActivityLogFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActivityLogPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ActivityLogFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActivityLogPayload>;
                };
                findMany: {
                    args: Prisma.ActivityLogFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActivityLogPayload>[];
                };
                create: {
                    args: Prisma.ActivityLogCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActivityLogPayload>;
                };
                createMany: {
                    args: Prisma.ActivityLogCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ActivityLogCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActivityLogPayload>[];
                };
                delete: {
                    args: Prisma.ActivityLogDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActivityLogPayload>;
                };
                update: {
                    args: Prisma.ActivityLogUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActivityLogPayload>;
                };
                deleteMany: {
                    args: Prisma.ActivityLogDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ActivityLogUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ActivityLogUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActivityLogPayload>[];
                };
                upsert: {
                    args: Prisma.ActivityLogUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ActivityLogPayload>;
                };
                aggregate: {
                    args: Prisma.ActivityLogAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateActivityLog>;
                };
                groupBy: {
                    args: Prisma.ActivityLogGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ActivityLogGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ActivityLogCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ActivityLogCountAggregateOutputType> | number;
                };
            };
        };
    };
} & {
    other: {
        payload: any;
        operations: {
            $executeRaw: {
                args: [query: TemplateStringsArray | Sql, ...values: any[]];
                result: any;
            };
            $executeRawUnsafe: {
                args: [query: string, ...values: any[]];
                result: any;
            };
            $queryRaw: {
                args: [query: TemplateStringsArray | Sql, ...values: any[]];
                result: any;
            };
            $queryRawUnsafe: {
                args: [query: string, ...values: any[]];
                result: any;
            };
        };
    };
};
/**
 * Enums
 */
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const UserScalarFieldEnum: {
    readonly id: "id";
    readonly firstName: "firstName";
    readonly lastName: "lastName";
    readonly profilePicture: "profilePicture";
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
    readonly DbNull: runtime.DbNullClass;
    readonly JsonNull: runtime.JsonNullClass;
};
export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput];
export declare const JsonNullValueInput: {
    readonly JsonNull: runtime.JsonNullClass;
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
    readonly DbNull: runtime.DbNullClass;
    readonly JsonNull: runtime.JsonNullClass;
    readonly AnyNull: runtime.AnyNullClass;
};
export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter];
/**
 * Field references
 */
/**
 * Reference to a field of type 'String'
 */
export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>;
/**
 * Reference to a field of type 'String[]'
 */
export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>;
/**
 * Reference to a field of type 'DateTime'
 */
export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>;
/**
 * Reference to a field of type 'DateTime[]'
 */
export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>;
/**
 * Reference to a field of type 'Int'
 */
export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>;
/**
 * Reference to a field of type 'Int[]'
 */
export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>;
/**
 * Reference to a field of type 'OrganizationStatus'
 */
export type EnumOrganizationStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'OrganizationStatus'>;
/**
 * Reference to a field of type 'OrganizationStatus[]'
 */
export type ListEnumOrganizationStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'OrganizationStatus[]'>;
/**
 * Reference to a field of type 'ProjectEnvironment'
 */
export type EnumProjectEnvironmentFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProjectEnvironment'>;
/**
 * Reference to a field of type 'ProjectEnvironment[]'
 */
export type ListEnumProjectEnvironmentFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProjectEnvironment[]'>;
/**
 * Reference to a field of type 'ProjectStatus'
 */
export type EnumProjectStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProjectStatus'>;
/**
 * Reference to a field of type 'ProjectStatus[]'
 */
export type ListEnumProjectStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProjectStatus[]'>;
/**
 * Reference to a field of type 'Json'
 */
export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>;
/**
 * Reference to a field of type 'QueryMode'
 */
export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>;
/**
 * Reference to a field of type 'ApiKeyStatus'
 */
export type EnumApiKeyStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ApiKeyStatus'>;
/**
 * Reference to a field of type 'ApiKeyStatus[]'
 */
export type ListEnumApiKeyStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ApiKeyStatus[]'>;
/**
 * Reference to a field of type 'CatalogStatus'
 */
export type EnumCatalogStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CatalogStatus'>;
/**
 * Reference to a field of type 'CatalogStatus[]'
 */
export type ListEnumCatalogStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CatalogStatus[]'>;
/**
 * Reference to a field of type 'AIModelType'
 */
export type EnumAIModelTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AIModelType'>;
/**
 * Reference to a field of type 'AIModelType[]'
 */
export type ListEnumAIModelTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AIModelType[]'>;
/**
 * Reference to a field of type 'Decimal'
 */
export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>;
/**
 * Reference to a field of type 'Decimal[]'
 */
export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>;
/**
 * Reference to a field of type 'AIServiceType'
 */
export type EnumAIServiceTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AIServiceType'>;
/**
 * Reference to a field of type 'AIServiceType[]'
 */
export type ListEnumAIServiceTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AIServiceType[]'>;
/**
 * Reference to a field of type 'AIRequestStatus'
 */
export type EnumAIRequestStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AIRequestStatus'>;
/**
 * Reference to a field of type 'AIRequestStatus[]'
 */
export type ListEnumAIRequestStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AIRequestStatus[]'>;
/**
 * Reference to a field of type 'ActionInvocationStatus'
 */
export type EnumActionInvocationStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ActionInvocationStatus'>;
/**
 * Reference to a field of type 'ActionInvocationStatus[]'
 */
export type ListEnumActionInvocationStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ActionInvocationStatus[]'>;
/**
 * Reference to a field of type 'WebhookEvent'
 */
export type EnumWebhookEventFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WebhookEvent'>;
/**
 * Reference to a field of type 'WebhookEvent[]'
 */
export type ListEnumWebhookEventFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WebhookEvent[]'>;
/**
 * Reference to a field of type 'WebhookStatus'
 */
export type EnumWebhookStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WebhookStatus'>;
/**
 * Reference to a field of type 'WebhookStatus[]'
 */
export type ListEnumWebhookStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WebhookStatus[]'>;
/**
 * Reference to a field of type 'SubscriptionStatus'
 */
export type EnumSubscriptionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SubscriptionStatus'>;
/**
 * Reference to a field of type 'SubscriptionStatus[]'
 */
export type ListEnumSubscriptionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SubscriptionStatus[]'>;
/**
 * Reference to a field of type 'PaymentStatus'
 */
export type EnumPaymentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentStatus'>;
/**
 * Reference to a field of type 'PaymentStatus[]'
 */
export type ListEnumPaymentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentStatus[]'>;
/**
 * Reference to a field of type 'Float'
 */
export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>;
/**
 * Reference to a field of type 'Float[]'
 */
export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>;
/**
 * Batch Payload for updateMany & deleteMany & createMany
 */
export type BatchPayload = {
    count: number;
};
export declare const defineExtension: runtime.Types.Extensions.ExtendsHook<"define", TypeMapCb, runtime.Types.Extensions.DefaultArgs>;
export type DefaultPrismaClient = PrismaClient;
export type ErrorFormat = 'pretty' | 'colorless' | 'minimal';
export type PrismaClientOptions = ({
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-pg`.
     */
    adapter: runtime.SqlDriverAdapterFactory;
    accelerateUrl?: never;
} | {
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl: string;
    adapter?: never;
}) & {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat;
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     *
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     *
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     *
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[];
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: TransactionIsolationLevel;
    };
    /**
     * Global configuration for omitting model fields by default.
     *
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: GlobalOmitConfig;
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     *
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[];
    /**
     * Optional maximum size for the query plan cache. If not provided, a default size will be used.
     * A value of `0` can be used to disable the cache entirely. A higher cache size can improve
     * performance for applications that execute a large number of unique queries, while a smaller
     * cache size can reduce memory usage.
     *
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   queryPlanCacheMaxSize: 100,
     * })
     * ```
     */
    queryPlanCacheMaxSize?: number;
};
export type GlobalOmitConfig = {
    user?: Prisma.UserOmit;
    role?: Prisma.RoleOmit;
    organization?: Prisma.OrganizationOmit;
    organizationMember?: Prisma.OrganizationMemberOmit;
    project?: Prisma.ProjectOmit;
    apiKey?: Prisma.ApiKeyOmit;
    aIProvider?: Prisma.AIProviderOmit;
    aIModel?: Prisma.AIModelOmit;
    aIRequest?: Prisma.AIRequestOmit;
    action?: Prisma.ActionOmit;
    actionInvocation?: Prisma.ActionInvocationOmit;
    usageAnalytics?: Prisma.UsageAnalyticsOmit;
    webhook?: Prisma.WebhookOmit;
    plan?: Prisma.PlanOmit;
    subscription?: Prisma.SubscriptionOmit;
    transaction?: Prisma.TransactionOmit;
    activityLog?: Prisma.ActivityLogOmit;
};
export type LogLevel = 'info' | 'query' | 'warn' | 'error';
export type LogDefinition = {
    level: LogLevel;
    emit: 'stdout' | 'event';
};
export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;
export type GetLogType<T> = CheckIsLogLevel<T extends LogDefinition ? T['level'] : T>;
export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition> ? GetLogType<T[number]> : never;
export type QueryEvent = {
    timestamp: Date;
    query: string;
    params: string;
    duration: number;
    target: string;
};
export type LogEvent = {
    timestamp: Date;
    message: string;
    target: string;
};
export type PrismaAction = 'findUnique' | 'findUniqueOrThrow' | 'findMany' | 'findFirst' | 'findFirstOrThrow' | 'create' | 'createMany' | 'createManyAndReturn' | 'update' | 'updateMany' | 'updateManyAndReturn' | 'upsert' | 'delete' | 'deleteMany' | 'executeRaw' | 'queryRaw' | 'aggregate' | 'count' | 'runCommandRaw' | 'findRaw' | 'groupBy';
/**
 * `PrismaClient` proxy available in interactive transactions.
 */
export type TransactionClient = Omit<DefaultPrismaClient, runtime.ITXClientDenyList>;
//# sourceMappingURL=prismaNamespace.d.ts.map
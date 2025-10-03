
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Pipeline
 * 
 */
export type Pipeline = $Result.DefaultSelection<Prisma.$PipelinePayload>
/**
 * Model PipelineTask
 * 
 */
export type PipelineTask = $Result.DefaultSelection<Prisma.$PipelineTaskPayload>
/**
 * Model AuditEvent
 * 
 */
export type AuditEvent = $Result.DefaultSelection<Prisma.$AuditEventPayload>
/**
 * Model Agent
 * 
 */
export type Agent = $Result.DefaultSelection<Prisma.$AgentPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const PipelineStatus: {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  AWAITING_APPROVAL: 'AWAITING_APPROVAL',
  APPROVED: 'APPROVED',
  FAILED: 'FAILED'
};

export type PipelineStatus = (typeof PipelineStatus)[keyof typeof PipelineStatus]


export const TaskStatus: {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  AWAITING_APPROVAL: 'AWAITING_APPROVAL',
  APPROVED: 'APPROVED',
  FAILED: 'FAILED'
};

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus]


export const AgentStatus: {
  ACTIVE: 'ACTIVE',
  DRAFT: 'DRAFT',
  DEPRECATED: 'DEPRECATED'
};

export type AgentStatus = (typeof AgentStatus)[keyof typeof AgentStatus]

}

export type PipelineStatus = $Enums.PipelineStatus

export const PipelineStatus: typeof $Enums.PipelineStatus

export type TaskStatus = $Enums.TaskStatus

export const TaskStatus: typeof $Enums.TaskStatus

export type AgentStatus = $Enums.AgentStatus

export const AgentStatus: typeof $Enums.AgentStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Pipelines
 * const pipelines = await prisma.pipeline.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Pipelines
   * const pipelines = await prisma.pipeline.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
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
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
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
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
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
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.pipeline`: Exposes CRUD operations for the **Pipeline** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Pipelines
    * const pipelines = await prisma.pipeline.findMany()
    * ```
    */
  get pipeline(): Prisma.PipelineDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.pipelineTask`: Exposes CRUD operations for the **PipelineTask** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PipelineTasks
    * const pipelineTasks = await prisma.pipelineTask.findMany()
    * ```
    */
  get pipelineTask(): Prisma.PipelineTaskDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.auditEvent`: Exposes CRUD operations for the **AuditEvent** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AuditEvents
    * const auditEvents = await prisma.auditEvent.findMany()
    * ```
    */
  get auditEvent(): Prisma.AuditEventDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.agent`: Exposes CRUD operations for the **Agent** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Agents
    * const agents = await prisma.agent.findMany()
    * ```
    */
  get agent(): Prisma.AgentDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.16.2
   * Query Engine version: 1c57fdcd7e44b29b9313256c76699e91c3ac3c43
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

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
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
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

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Pipeline: 'Pipeline',
    PipelineTask: 'PipelineTask',
    AuditEvent: 'AuditEvent',
    Agent: 'Agent'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "pipeline" | "pipelineTask" | "auditEvent" | "agent"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Pipeline: {
        payload: Prisma.$PipelinePayload<ExtArgs>
        fields: Prisma.PipelineFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PipelineFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelinePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PipelineFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelinePayload>
          }
          findFirst: {
            args: Prisma.PipelineFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelinePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PipelineFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelinePayload>
          }
          findMany: {
            args: Prisma.PipelineFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelinePayload>[]
          }
          create: {
            args: Prisma.PipelineCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelinePayload>
          }
          createMany: {
            args: Prisma.PipelineCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PipelineCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelinePayload>[]
          }
          delete: {
            args: Prisma.PipelineDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelinePayload>
          }
          update: {
            args: Prisma.PipelineUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelinePayload>
          }
          deleteMany: {
            args: Prisma.PipelineDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PipelineUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PipelineUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelinePayload>[]
          }
          upsert: {
            args: Prisma.PipelineUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelinePayload>
          }
          aggregate: {
            args: Prisma.PipelineAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePipeline>
          }
          groupBy: {
            args: Prisma.PipelineGroupByArgs<ExtArgs>
            result: $Utils.Optional<PipelineGroupByOutputType>[]
          }
          count: {
            args: Prisma.PipelineCountArgs<ExtArgs>
            result: $Utils.Optional<PipelineCountAggregateOutputType> | number
          }
        }
      }
      PipelineTask: {
        payload: Prisma.$PipelineTaskPayload<ExtArgs>
        fields: Prisma.PipelineTaskFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PipelineTaskFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineTaskPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PipelineTaskFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineTaskPayload>
          }
          findFirst: {
            args: Prisma.PipelineTaskFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineTaskPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PipelineTaskFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineTaskPayload>
          }
          findMany: {
            args: Prisma.PipelineTaskFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineTaskPayload>[]
          }
          create: {
            args: Prisma.PipelineTaskCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineTaskPayload>
          }
          createMany: {
            args: Prisma.PipelineTaskCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PipelineTaskCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineTaskPayload>[]
          }
          delete: {
            args: Prisma.PipelineTaskDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineTaskPayload>
          }
          update: {
            args: Prisma.PipelineTaskUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineTaskPayload>
          }
          deleteMany: {
            args: Prisma.PipelineTaskDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PipelineTaskUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PipelineTaskUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineTaskPayload>[]
          }
          upsert: {
            args: Prisma.PipelineTaskUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PipelineTaskPayload>
          }
          aggregate: {
            args: Prisma.PipelineTaskAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePipelineTask>
          }
          groupBy: {
            args: Prisma.PipelineTaskGroupByArgs<ExtArgs>
            result: $Utils.Optional<PipelineTaskGroupByOutputType>[]
          }
          count: {
            args: Prisma.PipelineTaskCountArgs<ExtArgs>
            result: $Utils.Optional<PipelineTaskCountAggregateOutputType> | number
          }
        }
      }
      AuditEvent: {
        payload: Prisma.$AuditEventPayload<ExtArgs>
        fields: Prisma.AuditEventFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AuditEventFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AuditEventFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload>
          }
          findFirst: {
            args: Prisma.AuditEventFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AuditEventFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload>
          }
          findMany: {
            args: Prisma.AuditEventFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload>[]
          }
          create: {
            args: Prisma.AuditEventCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload>
          }
          createMany: {
            args: Prisma.AuditEventCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AuditEventCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload>[]
          }
          delete: {
            args: Prisma.AuditEventDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload>
          }
          update: {
            args: Prisma.AuditEventUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload>
          }
          deleteMany: {
            args: Prisma.AuditEventDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AuditEventUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AuditEventUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload>[]
          }
          upsert: {
            args: Prisma.AuditEventUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload>
          }
          aggregate: {
            args: Prisma.AuditEventAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAuditEvent>
          }
          groupBy: {
            args: Prisma.AuditEventGroupByArgs<ExtArgs>
            result: $Utils.Optional<AuditEventGroupByOutputType>[]
          }
          count: {
            args: Prisma.AuditEventCountArgs<ExtArgs>
            result: $Utils.Optional<AuditEventCountAggregateOutputType> | number
          }
        }
      }
      Agent: {
        payload: Prisma.$AgentPayload<ExtArgs>
        fields: Prisma.AgentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AgentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AgentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload>
          }
          findFirst: {
            args: Prisma.AgentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AgentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload>
          }
          findMany: {
            args: Prisma.AgentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload>[]
          }
          create: {
            args: Prisma.AgentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload>
          }
          createMany: {
            args: Prisma.AgentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AgentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload>[]
          }
          delete: {
            args: Prisma.AgentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload>
          }
          update: {
            args: Prisma.AgentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload>
          }
          deleteMany: {
            args: Prisma.AgentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AgentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AgentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload>[]
          }
          upsert: {
            args: Prisma.AgentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentPayload>
          }
          aggregate: {
            args: Prisma.AgentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAgent>
          }
          groupBy: {
            args: Prisma.AgentGroupByArgs<ExtArgs>
            result: $Utils.Optional<AgentGroupByOutputType>[]
          }
          count: {
            args: Prisma.AgentCountArgs<ExtArgs>
            result: $Utils.Optional<AgentCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
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
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
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
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    pipeline?: PipelineOmit
    pipelineTask?: PipelineTaskOmit
    auditEvent?: AuditEventOmit
    agent?: AgentOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type PipelineCountOutputType
   */

  export type PipelineCountOutputType = {
    tasks: number
  }

  export type PipelineCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tasks?: boolean | PipelineCountOutputTypeCountTasksArgs
  }

  // Custom InputTypes
  /**
   * PipelineCountOutputType without action
   */
  export type PipelineCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineCountOutputType
     */
    select?: PipelineCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PipelineCountOutputType without action
   */
  export type PipelineCountOutputTypeCountTasksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PipelineTaskWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Pipeline
   */

  export type AggregatePipeline = {
    _count: PipelineCountAggregateOutputType | null
    _min: PipelineMinAggregateOutputType | null
    _max: PipelineMaxAggregateOutputType | null
  }

  export type PipelineMinAggregateOutputType = {
    id: string | null
    orgId: string | null
    name: string | null
    description: string | null
    owner: string | null
    status: $Enums.PipelineStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PipelineMaxAggregateOutputType = {
    id: string | null
    orgId: string | null
    name: string | null
    description: string | null
    owner: string | null
    status: $Enums.PipelineStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PipelineCountAggregateOutputType = {
    id: number
    orgId: number
    name: number
    description: number
    owner: number
    status: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PipelineMinAggregateInputType = {
    id?: true
    orgId?: true
    name?: true
    description?: true
    owner?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PipelineMaxAggregateInputType = {
    id?: true
    orgId?: true
    name?: true
    description?: true
    owner?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PipelineCountAggregateInputType = {
    id?: true
    orgId?: true
    name?: true
    description?: true
    owner?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PipelineAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Pipeline to aggregate.
     */
    where?: PipelineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Pipelines to fetch.
     */
    orderBy?: PipelineOrderByWithRelationInput | PipelineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PipelineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Pipelines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Pipelines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Pipelines
    **/
    _count?: true | PipelineCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PipelineMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PipelineMaxAggregateInputType
  }

  export type GetPipelineAggregateType<T extends PipelineAggregateArgs> = {
        [P in keyof T & keyof AggregatePipeline]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePipeline[P]>
      : GetScalarType<T[P], AggregatePipeline[P]>
  }




  export type PipelineGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PipelineWhereInput
    orderBy?: PipelineOrderByWithAggregationInput | PipelineOrderByWithAggregationInput[]
    by: PipelineScalarFieldEnum[] | PipelineScalarFieldEnum
    having?: PipelineScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PipelineCountAggregateInputType | true
    _min?: PipelineMinAggregateInputType
    _max?: PipelineMaxAggregateInputType
  }

  export type PipelineGroupByOutputType = {
    id: string
    orgId: string
    name: string
    description: string | null
    owner: string
    status: $Enums.PipelineStatus
    createdAt: Date
    updatedAt: Date
    _count: PipelineCountAggregateOutputType | null
    _min: PipelineMinAggregateOutputType | null
    _max: PipelineMaxAggregateOutputType | null
  }

  type GetPipelineGroupByPayload<T extends PipelineGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PipelineGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PipelineGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PipelineGroupByOutputType[P]>
            : GetScalarType<T[P], PipelineGroupByOutputType[P]>
        }
      >
    >


  export type PipelineSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    orgId?: boolean
    name?: boolean
    description?: boolean
    owner?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    tasks?: boolean | Pipeline$tasksArgs<ExtArgs>
    _count?: boolean | PipelineCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["pipeline"]>

  export type PipelineSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    orgId?: boolean
    name?: boolean
    description?: boolean
    owner?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["pipeline"]>

  export type PipelineSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    orgId?: boolean
    name?: boolean
    description?: boolean
    owner?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["pipeline"]>

  export type PipelineSelectScalar = {
    id?: boolean
    orgId?: boolean
    name?: boolean
    description?: boolean
    owner?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PipelineOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "orgId" | "name" | "description" | "owner" | "status" | "createdAt" | "updatedAt", ExtArgs["result"]["pipeline"]>
  export type PipelineInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tasks?: boolean | Pipeline$tasksArgs<ExtArgs>
    _count?: boolean | PipelineCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type PipelineIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type PipelineIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $PipelinePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Pipeline"
    objects: {
      tasks: Prisma.$PipelineTaskPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      orgId: string
      name: string
      description: string | null
      owner: string
      status: $Enums.PipelineStatus
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["pipeline"]>
    composites: {}
  }

  type PipelineGetPayload<S extends boolean | null | undefined | PipelineDefaultArgs> = $Result.GetResult<Prisma.$PipelinePayload, S>

  type PipelineCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PipelineFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PipelineCountAggregateInputType | true
    }

  export interface PipelineDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Pipeline'], meta: { name: 'Pipeline' } }
    /**
     * Find zero or one Pipeline that matches the filter.
     * @param {PipelineFindUniqueArgs} args - Arguments to find a Pipeline
     * @example
     * // Get one Pipeline
     * const pipeline = await prisma.pipeline.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PipelineFindUniqueArgs>(args: SelectSubset<T, PipelineFindUniqueArgs<ExtArgs>>): Prisma__PipelineClient<$Result.GetResult<Prisma.$PipelinePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Pipeline that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PipelineFindUniqueOrThrowArgs} args - Arguments to find a Pipeline
     * @example
     * // Get one Pipeline
     * const pipeline = await prisma.pipeline.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PipelineFindUniqueOrThrowArgs>(args: SelectSubset<T, PipelineFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PipelineClient<$Result.GetResult<Prisma.$PipelinePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Pipeline that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineFindFirstArgs} args - Arguments to find a Pipeline
     * @example
     * // Get one Pipeline
     * const pipeline = await prisma.pipeline.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PipelineFindFirstArgs>(args?: SelectSubset<T, PipelineFindFirstArgs<ExtArgs>>): Prisma__PipelineClient<$Result.GetResult<Prisma.$PipelinePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Pipeline that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineFindFirstOrThrowArgs} args - Arguments to find a Pipeline
     * @example
     * // Get one Pipeline
     * const pipeline = await prisma.pipeline.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PipelineFindFirstOrThrowArgs>(args?: SelectSubset<T, PipelineFindFirstOrThrowArgs<ExtArgs>>): Prisma__PipelineClient<$Result.GetResult<Prisma.$PipelinePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Pipelines that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Pipelines
     * const pipelines = await prisma.pipeline.findMany()
     * 
     * // Get first 10 Pipelines
     * const pipelines = await prisma.pipeline.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const pipelineWithIdOnly = await prisma.pipeline.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PipelineFindManyArgs>(args?: SelectSubset<T, PipelineFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PipelinePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Pipeline.
     * @param {PipelineCreateArgs} args - Arguments to create a Pipeline.
     * @example
     * // Create one Pipeline
     * const Pipeline = await prisma.pipeline.create({
     *   data: {
     *     // ... data to create a Pipeline
     *   }
     * })
     * 
     */
    create<T extends PipelineCreateArgs>(args: SelectSubset<T, PipelineCreateArgs<ExtArgs>>): Prisma__PipelineClient<$Result.GetResult<Prisma.$PipelinePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Pipelines.
     * @param {PipelineCreateManyArgs} args - Arguments to create many Pipelines.
     * @example
     * // Create many Pipelines
     * const pipeline = await prisma.pipeline.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PipelineCreateManyArgs>(args?: SelectSubset<T, PipelineCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Pipelines and returns the data saved in the database.
     * @param {PipelineCreateManyAndReturnArgs} args - Arguments to create many Pipelines.
     * @example
     * // Create many Pipelines
     * const pipeline = await prisma.pipeline.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Pipelines and only return the `id`
     * const pipelineWithIdOnly = await prisma.pipeline.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PipelineCreateManyAndReturnArgs>(args?: SelectSubset<T, PipelineCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PipelinePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Pipeline.
     * @param {PipelineDeleteArgs} args - Arguments to delete one Pipeline.
     * @example
     * // Delete one Pipeline
     * const Pipeline = await prisma.pipeline.delete({
     *   where: {
     *     // ... filter to delete one Pipeline
     *   }
     * })
     * 
     */
    delete<T extends PipelineDeleteArgs>(args: SelectSubset<T, PipelineDeleteArgs<ExtArgs>>): Prisma__PipelineClient<$Result.GetResult<Prisma.$PipelinePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Pipeline.
     * @param {PipelineUpdateArgs} args - Arguments to update one Pipeline.
     * @example
     * // Update one Pipeline
     * const pipeline = await prisma.pipeline.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PipelineUpdateArgs>(args: SelectSubset<T, PipelineUpdateArgs<ExtArgs>>): Prisma__PipelineClient<$Result.GetResult<Prisma.$PipelinePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Pipelines.
     * @param {PipelineDeleteManyArgs} args - Arguments to filter Pipelines to delete.
     * @example
     * // Delete a few Pipelines
     * const { count } = await prisma.pipeline.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PipelineDeleteManyArgs>(args?: SelectSubset<T, PipelineDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Pipelines.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Pipelines
     * const pipeline = await prisma.pipeline.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PipelineUpdateManyArgs>(args: SelectSubset<T, PipelineUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Pipelines and returns the data updated in the database.
     * @param {PipelineUpdateManyAndReturnArgs} args - Arguments to update many Pipelines.
     * @example
     * // Update many Pipelines
     * const pipeline = await prisma.pipeline.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Pipelines and only return the `id`
     * const pipelineWithIdOnly = await prisma.pipeline.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PipelineUpdateManyAndReturnArgs>(args: SelectSubset<T, PipelineUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PipelinePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Pipeline.
     * @param {PipelineUpsertArgs} args - Arguments to update or create a Pipeline.
     * @example
     * // Update or create a Pipeline
     * const pipeline = await prisma.pipeline.upsert({
     *   create: {
     *     // ... data to create a Pipeline
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Pipeline we want to update
     *   }
     * })
     */
    upsert<T extends PipelineUpsertArgs>(args: SelectSubset<T, PipelineUpsertArgs<ExtArgs>>): Prisma__PipelineClient<$Result.GetResult<Prisma.$PipelinePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Pipelines.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineCountArgs} args - Arguments to filter Pipelines to count.
     * @example
     * // Count the number of Pipelines
     * const count = await prisma.pipeline.count({
     *   where: {
     *     // ... the filter for the Pipelines we want to count
     *   }
     * })
    **/
    count<T extends PipelineCountArgs>(
      args?: Subset<T, PipelineCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PipelineCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Pipeline.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PipelineAggregateArgs>(args: Subset<T, PipelineAggregateArgs>): Prisma.PrismaPromise<GetPipelineAggregateType<T>>

    /**
     * Group by Pipeline.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PipelineGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PipelineGroupByArgs['orderBy'] }
        : { orderBy?: PipelineGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PipelineGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPipelineGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Pipeline model
   */
  readonly fields: PipelineFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Pipeline.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PipelineClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tasks<T extends Pipeline$tasksArgs<ExtArgs> = {}>(args?: Subset<T, Pipeline$tasksArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PipelineTaskPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Pipeline model
   */
  interface PipelineFieldRefs {
    readonly id: FieldRef<"Pipeline", 'String'>
    readonly orgId: FieldRef<"Pipeline", 'String'>
    readonly name: FieldRef<"Pipeline", 'String'>
    readonly description: FieldRef<"Pipeline", 'String'>
    readonly owner: FieldRef<"Pipeline", 'String'>
    readonly status: FieldRef<"Pipeline", 'PipelineStatus'>
    readonly createdAt: FieldRef<"Pipeline", 'DateTime'>
    readonly updatedAt: FieldRef<"Pipeline", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Pipeline findUnique
   */
  export type PipelineFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Pipeline
     */
    select?: PipelineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Pipeline
     */
    omit?: PipelineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineInclude<ExtArgs> | null
    /**
     * Filter, which Pipeline to fetch.
     */
    where: PipelineWhereUniqueInput
  }

  /**
   * Pipeline findUniqueOrThrow
   */
  export type PipelineFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Pipeline
     */
    select?: PipelineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Pipeline
     */
    omit?: PipelineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineInclude<ExtArgs> | null
    /**
     * Filter, which Pipeline to fetch.
     */
    where: PipelineWhereUniqueInput
  }

  /**
   * Pipeline findFirst
   */
  export type PipelineFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Pipeline
     */
    select?: PipelineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Pipeline
     */
    omit?: PipelineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineInclude<ExtArgs> | null
    /**
     * Filter, which Pipeline to fetch.
     */
    where?: PipelineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Pipelines to fetch.
     */
    orderBy?: PipelineOrderByWithRelationInput | PipelineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Pipelines.
     */
    cursor?: PipelineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Pipelines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Pipelines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Pipelines.
     */
    distinct?: PipelineScalarFieldEnum | PipelineScalarFieldEnum[]
  }

  /**
   * Pipeline findFirstOrThrow
   */
  export type PipelineFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Pipeline
     */
    select?: PipelineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Pipeline
     */
    omit?: PipelineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineInclude<ExtArgs> | null
    /**
     * Filter, which Pipeline to fetch.
     */
    where?: PipelineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Pipelines to fetch.
     */
    orderBy?: PipelineOrderByWithRelationInput | PipelineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Pipelines.
     */
    cursor?: PipelineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Pipelines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Pipelines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Pipelines.
     */
    distinct?: PipelineScalarFieldEnum | PipelineScalarFieldEnum[]
  }

  /**
   * Pipeline findMany
   */
  export type PipelineFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Pipeline
     */
    select?: PipelineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Pipeline
     */
    omit?: PipelineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineInclude<ExtArgs> | null
    /**
     * Filter, which Pipelines to fetch.
     */
    where?: PipelineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Pipelines to fetch.
     */
    orderBy?: PipelineOrderByWithRelationInput | PipelineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Pipelines.
     */
    cursor?: PipelineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Pipelines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Pipelines.
     */
    skip?: number
    distinct?: PipelineScalarFieldEnum | PipelineScalarFieldEnum[]
  }

  /**
   * Pipeline create
   */
  export type PipelineCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Pipeline
     */
    select?: PipelineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Pipeline
     */
    omit?: PipelineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineInclude<ExtArgs> | null
    /**
     * The data needed to create a Pipeline.
     */
    data: XOR<PipelineCreateInput, PipelineUncheckedCreateInput>
  }

  /**
   * Pipeline createMany
   */
  export type PipelineCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Pipelines.
     */
    data: PipelineCreateManyInput | PipelineCreateManyInput[]
  }

  /**
   * Pipeline createManyAndReturn
   */
  export type PipelineCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Pipeline
     */
    select?: PipelineSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Pipeline
     */
    omit?: PipelineOmit<ExtArgs> | null
    /**
     * The data used to create many Pipelines.
     */
    data: PipelineCreateManyInput | PipelineCreateManyInput[]
  }

  /**
   * Pipeline update
   */
  export type PipelineUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Pipeline
     */
    select?: PipelineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Pipeline
     */
    omit?: PipelineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineInclude<ExtArgs> | null
    /**
     * The data needed to update a Pipeline.
     */
    data: XOR<PipelineUpdateInput, PipelineUncheckedUpdateInput>
    /**
     * Choose, which Pipeline to update.
     */
    where: PipelineWhereUniqueInput
  }

  /**
   * Pipeline updateMany
   */
  export type PipelineUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Pipelines.
     */
    data: XOR<PipelineUpdateManyMutationInput, PipelineUncheckedUpdateManyInput>
    /**
     * Filter which Pipelines to update
     */
    where?: PipelineWhereInput
    /**
     * Limit how many Pipelines to update.
     */
    limit?: number
  }

  /**
   * Pipeline updateManyAndReturn
   */
  export type PipelineUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Pipeline
     */
    select?: PipelineSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Pipeline
     */
    omit?: PipelineOmit<ExtArgs> | null
    /**
     * The data used to update Pipelines.
     */
    data: XOR<PipelineUpdateManyMutationInput, PipelineUncheckedUpdateManyInput>
    /**
     * Filter which Pipelines to update
     */
    where?: PipelineWhereInput
    /**
     * Limit how many Pipelines to update.
     */
    limit?: number
  }

  /**
   * Pipeline upsert
   */
  export type PipelineUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Pipeline
     */
    select?: PipelineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Pipeline
     */
    omit?: PipelineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineInclude<ExtArgs> | null
    /**
     * The filter to search for the Pipeline to update in case it exists.
     */
    where: PipelineWhereUniqueInput
    /**
     * In case the Pipeline found by the `where` argument doesn't exist, create a new Pipeline with this data.
     */
    create: XOR<PipelineCreateInput, PipelineUncheckedCreateInput>
    /**
     * In case the Pipeline was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PipelineUpdateInput, PipelineUncheckedUpdateInput>
  }

  /**
   * Pipeline delete
   */
  export type PipelineDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Pipeline
     */
    select?: PipelineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Pipeline
     */
    omit?: PipelineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineInclude<ExtArgs> | null
    /**
     * Filter which Pipeline to delete.
     */
    where: PipelineWhereUniqueInput
  }

  /**
   * Pipeline deleteMany
   */
  export type PipelineDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Pipelines to delete
     */
    where?: PipelineWhereInput
    /**
     * Limit how many Pipelines to delete.
     */
    limit?: number
  }

  /**
   * Pipeline.tasks
   */
  export type Pipeline$tasksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineTask
     */
    select?: PipelineTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PipelineTask
     */
    omit?: PipelineTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineTaskInclude<ExtArgs> | null
    where?: PipelineTaskWhereInput
    orderBy?: PipelineTaskOrderByWithRelationInput | PipelineTaskOrderByWithRelationInput[]
    cursor?: PipelineTaskWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PipelineTaskScalarFieldEnum | PipelineTaskScalarFieldEnum[]
  }

  /**
   * Pipeline without action
   */
  export type PipelineDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Pipeline
     */
    select?: PipelineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Pipeline
     */
    omit?: PipelineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineInclude<ExtArgs> | null
  }


  /**
   * Model PipelineTask
   */

  export type AggregatePipelineTask = {
    _count: PipelineTaskCountAggregateOutputType | null
    _avg: PipelineTaskAvgAggregateOutputType | null
    _sum: PipelineTaskSumAggregateOutputType | null
    _min: PipelineTaskMinAggregateOutputType | null
    _max: PipelineTaskMaxAggregateOutputType | null
  }

  export type PipelineTaskAvgAggregateOutputType = {
    stepOrder: number | null
  }

  export type PipelineTaskSumAggregateOutputType = {
    stepOrder: number | null
  }

  export type PipelineTaskMinAggregateOutputType = {
    id: string | null
    pipelineId: string | null
    name: string | null
    owner: string | null
    status: $Enums.TaskStatus | null
    startedAt: Date | null
    completedAt: Date | null
    stepOrder: number | null
  }

  export type PipelineTaskMaxAggregateOutputType = {
    id: string | null
    pipelineId: string | null
    name: string | null
    owner: string | null
    status: $Enums.TaskStatus | null
    startedAt: Date | null
    completedAt: Date | null
    stepOrder: number | null
  }

  export type PipelineTaskCountAggregateOutputType = {
    id: number
    pipelineId: number
    name: number
    owner: number
    status: number
    startedAt: number
    completedAt: number
    stepOrder: number
    _all: number
  }


  export type PipelineTaskAvgAggregateInputType = {
    stepOrder?: true
  }

  export type PipelineTaskSumAggregateInputType = {
    stepOrder?: true
  }

  export type PipelineTaskMinAggregateInputType = {
    id?: true
    pipelineId?: true
    name?: true
    owner?: true
    status?: true
    startedAt?: true
    completedAt?: true
    stepOrder?: true
  }

  export type PipelineTaskMaxAggregateInputType = {
    id?: true
    pipelineId?: true
    name?: true
    owner?: true
    status?: true
    startedAt?: true
    completedAt?: true
    stepOrder?: true
  }

  export type PipelineTaskCountAggregateInputType = {
    id?: true
    pipelineId?: true
    name?: true
    owner?: true
    status?: true
    startedAt?: true
    completedAt?: true
    stepOrder?: true
    _all?: true
  }

  export type PipelineTaskAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PipelineTask to aggregate.
     */
    where?: PipelineTaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PipelineTasks to fetch.
     */
    orderBy?: PipelineTaskOrderByWithRelationInput | PipelineTaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PipelineTaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PipelineTasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PipelineTasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PipelineTasks
    **/
    _count?: true | PipelineTaskCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PipelineTaskAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PipelineTaskSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PipelineTaskMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PipelineTaskMaxAggregateInputType
  }

  export type GetPipelineTaskAggregateType<T extends PipelineTaskAggregateArgs> = {
        [P in keyof T & keyof AggregatePipelineTask]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePipelineTask[P]>
      : GetScalarType<T[P], AggregatePipelineTask[P]>
  }




  export type PipelineTaskGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PipelineTaskWhereInput
    orderBy?: PipelineTaskOrderByWithAggregationInput | PipelineTaskOrderByWithAggregationInput[]
    by: PipelineTaskScalarFieldEnum[] | PipelineTaskScalarFieldEnum
    having?: PipelineTaskScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PipelineTaskCountAggregateInputType | true
    _avg?: PipelineTaskAvgAggregateInputType
    _sum?: PipelineTaskSumAggregateInputType
    _min?: PipelineTaskMinAggregateInputType
    _max?: PipelineTaskMaxAggregateInputType
  }

  export type PipelineTaskGroupByOutputType = {
    id: string
    pipelineId: string
    name: string
    owner: string
    status: $Enums.TaskStatus
    startedAt: Date | null
    completedAt: Date | null
    stepOrder: number
    _count: PipelineTaskCountAggregateOutputType | null
    _avg: PipelineTaskAvgAggregateOutputType | null
    _sum: PipelineTaskSumAggregateOutputType | null
    _min: PipelineTaskMinAggregateOutputType | null
    _max: PipelineTaskMaxAggregateOutputType | null
  }

  type GetPipelineTaskGroupByPayload<T extends PipelineTaskGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PipelineTaskGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PipelineTaskGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PipelineTaskGroupByOutputType[P]>
            : GetScalarType<T[P], PipelineTaskGroupByOutputType[P]>
        }
      >
    >


  export type PipelineTaskSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    pipelineId?: boolean
    name?: boolean
    owner?: boolean
    status?: boolean
    startedAt?: boolean
    completedAt?: boolean
    stepOrder?: boolean
    pipeline?: boolean | PipelineDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["pipelineTask"]>

  export type PipelineTaskSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    pipelineId?: boolean
    name?: boolean
    owner?: boolean
    status?: boolean
    startedAt?: boolean
    completedAt?: boolean
    stepOrder?: boolean
    pipeline?: boolean | PipelineDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["pipelineTask"]>

  export type PipelineTaskSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    pipelineId?: boolean
    name?: boolean
    owner?: boolean
    status?: boolean
    startedAt?: boolean
    completedAt?: boolean
    stepOrder?: boolean
    pipeline?: boolean | PipelineDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["pipelineTask"]>

  export type PipelineTaskSelectScalar = {
    id?: boolean
    pipelineId?: boolean
    name?: boolean
    owner?: boolean
    status?: boolean
    startedAt?: boolean
    completedAt?: boolean
    stepOrder?: boolean
  }

  export type PipelineTaskOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "pipelineId" | "name" | "owner" | "status" | "startedAt" | "completedAt" | "stepOrder", ExtArgs["result"]["pipelineTask"]>
  export type PipelineTaskInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    pipeline?: boolean | PipelineDefaultArgs<ExtArgs>
  }
  export type PipelineTaskIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    pipeline?: boolean | PipelineDefaultArgs<ExtArgs>
  }
  export type PipelineTaskIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    pipeline?: boolean | PipelineDefaultArgs<ExtArgs>
  }

  export type $PipelineTaskPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PipelineTask"
    objects: {
      pipeline: Prisma.$PipelinePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      pipelineId: string
      name: string
      owner: string
      status: $Enums.TaskStatus
      startedAt: Date | null
      completedAt: Date | null
      stepOrder: number
    }, ExtArgs["result"]["pipelineTask"]>
    composites: {}
  }

  type PipelineTaskGetPayload<S extends boolean | null | undefined | PipelineTaskDefaultArgs> = $Result.GetResult<Prisma.$PipelineTaskPayload, S>

  type PipelineTaskCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PipelineTaskFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PipelineTaskCountAggregateInputType | true
    }

  export interface PipelineTaskDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PipelineTask'], meta: { name: 'PipelineTask' } }
    /**
     * Find zero or one PipelineTask that matches the filter.
     * @param {PipelineTaskFindUniqueArgs} args - Arguments to find a PipelineTask
     * @example
     * // Get one PipelineTask
     * const pipelineTask = await prisma.pipelineTask.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PipelineTaskFindUniqueArgs>(args: SelectSubset<T, PipelineTaskFindUniqueArgs<ExtArgs>>): Prisma__PipelineTaskClient<$Result.GetResult<Prisma.$PipelineTaskPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PipelineTask that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PipelineTaskFindUniqueOrThrowArgs} args - Arguments to find a PipelineTask
     * @example
     * // Get one PipelineTask
     * const pipelineTask = await prisma.pipelineTask.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PipelineTaskFindUniqueOrThrowArgs>(args: SelectSubset<T, PipelineTaskFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PipelineTaskClient<$Result.GetResult<Prisma.$PipelineTaskPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PipelineTask that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineTaskFindFirstArgs} args - Arguments to find a PipelineTask
     * @example
     * // Get one PipelineTask
     * const pipelineTask = await prisma.pipelineTask.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PipelineTaskFindFirstArgs>(args?: SelectSubset<T, PipelineTaskFindFirstArgs<ExtArgs>>): Prisma__PipelineTaskClient<$Result.GetResult<Prisma.$PipelineTaskPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PipelineTask that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineTaskFindFirstOrThrowArgs} args - Arguments to find a PipelineTask
     * @example
     * // Get one PipelineTask
     * const pipelineTask = await prisma.pipelineTask.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PipelineTaskFindFirstOrThrowArgs>(args?: SelectSubset<T, PipelineTaskFindFirstOrThrowArgs<ExtArgs>>): Prisma__PipelineTaskClient<$Result.GetResult<Prisma.$PipelineTaskPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PipelineTasks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineTaskFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PipelineTasks
     * const pipelineTasks = await prisma.pipelineTask.findMany()
     * 
     * // Get first 10 PipelineTasks
     * const pipelineTasks = await prisma.pipelineTask.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const pipelineTaskWithIdOnly = await prisma.pipelineTask.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PipelineTaskFindManyArgs>(args?: SelectSubset<T, PipelineTaskFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PipelineTaskPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PipelineTask.
     * @param {PipelineTaskCreateArgs} args - Arguments to create a PipelineTask.
     * @example
     * // Create one PipelineTask
     * const PipelineTask = await prisma.pipelineTask.create({
     *   data: {
     *     // ... data to create a PipelineTask
     *   }
     * })
     * 
     */
    create<T extends PipelineTaskCreateArgs>(args: SelectSubset<T, PipelineTaskCreateArgs<ExtArgs>>): Prisma__PipelineTaskClient<$Result.GetResult<Prisma.$PipelineTaskPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PipelineTasks.
     * @param {PipelineTaskCreateManyArgs} args - Arguments to create many PipelineTasks.
     * @example
     * // Create many PipelineTasks
     * const pipelineTask = await prisma.pipelineTask.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PipelineTaskCreateManyArgs>(args?: SelectSubset<T, PipelineTaskCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PipelineTasks and returns the data saved in the database.
     * @param {PipelineTaskCreateManyAndReturnArgs} args - Arguments to create many PipelineTasks.
     * @example
     * // Create many PipelineTasks
     * const pipelineTask = await prisma.pipelineTask.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PipelineTasks and only return the `id`
     * const pipelineTaskWithIdOnly = await prisma.pipelineTask.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PipelineTaskCreateManyAndReturnArgs>(args?: SelectSubset<T, PipelineTaskCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PipelineTaskPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PipelineTask.
     * @param {PipelineTaskDeleteArgs} args - Arguments to delete one PipelineTask.
     * @example
     * // Delete one PipelineTask
     * const PipelineTask = await prisma.pipelineTask.delete({
     *   where: {
     *     // ... filter to delete one PipelineTask
     *   }
     * })
     * 
     */
    delete<T extends PipelineTaskDeleteArgs>(args: SelectSubset<T, PipelineTaskDeleteArgs<ExtArgs>>): Prisma__PipelineTaskClient<$Result.GetResult<Prisma.$PipelineTaskPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PipelineTask.
     * @param {PipelineTaskUpdateArgs} args - Arguments to update one PipelineTask.
     * @example
     * // Update one PipelineTask
     * const pipelineTask = await prisma.pipelineTask.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PipelineTaskUpdateArgs>(args: SelectSubset<T, PipelineTaskUpdateArgs<ExtArgs>>): Prisma__PipelineTaskClient<$Result.GetResult<Prisma.$PipelineTaskPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PipelineTasks.
     * @param {PipelineTaskDeleteManyArgs} args - Arguments to filter PipelineTasks to delete.
     * @example
     * // Delete a few PipelineTasks
     * const { count } = await prisma.pipelineTask.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PipelineTaskDeleteManyArgs>(args?: SelectSubset<T, PipelineTaskDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PipelineTasks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineTaskUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PipelineTasks
     * const pipelineTask = await prisma.pipelineTask.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PipelineTaskUpdateManyArgs>(args: SelectSubset<T, PipelineTaskUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PipelineTasks and returns the data updated in the database.
     * @param {PipelineTaskUpdateManyAndReturnArgs} args - Arguments to update many PipelineTasks.
     * @example
     * // Update many PipelineTasks
     * const pipelineTask = await prisma.pipelineTask.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PipelineTasks and only return the `id`
     * const pipelineTaskWithIdOnly = await prisma.pipelineTask.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PipelineTaskUpdateManyAndReturnArgs>(args: SelectSubset<T, PipelineTaskUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PipelineTaskPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PipelineTask.
     * @param {PipelineTaskUpsertArgs} args - Arguments to update or create a PipelineTask.
     * @example
     * // Update or create a PipelineTask
     * const pipelineTask = await prisma.pipelineTask.upsert({
     *   create: {
     *     // ... data to create a PipelineTask
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PipelineTask we want to update
     *   }
     * })
     */
    upsert<T extends PipelineTaskUpsertArgs>(args: SelectSubset<T, PipelineTaskUpsertArgs<ExtArgs>>): Prisma__PipelineTaskClient<$Result.GetResult<Prisma.$PipelineTaskPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PipelineTasks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineTaskCountArgs} args - Arguments to filter PipelineTasks to count.
     * @example
     * // Count the number of PipelineTasks
     * const count = await prisma.pipelineTask.count({
     *   where: {
     *     // ... the filter for the PipelineTasks we want to count
     *   }
     * })
    **/
    count<T extends PipelineTaskCountArgs>(
      args?: Subset<T, PipelineTaskCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PipelineTaskCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PipelineTask.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineTaskAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PipelineTaskAggregateArgs>(args: Subset<T, PipelineTaskAggregateArgs>): Prisma.PrismaPromise<GetPipelineTaskAggregateType<T>>

    /**
     * Group by PipelineTask.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PipelineTaskGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PipelineTaskGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PipelineTaskGroupByArgs['orderBy'] }
        : { orderBy?: PipelineTaskGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PipelineTaskGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPipelineTaskGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PipelineTask model
   */
  readonly fields: PipelineTaskFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PipelineTask.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PipelineTaskClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    pipeline<T extends PipelineDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PipelineDefaultArgs<ExtArgs>>): Prisma__PipelineClient<$Result.GetResult<Prisma.$PipelinePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PipelineTask model
   */
  interface PipelineTaskFieldRefs {
    readonly id: FieldRef<"PipelineTask", 'String'>
    readonly pipelineId: FieldRef<"PipelineTask", 'String'>
    readonly name: FieldRef<"PipelineTask", 'String'>
    readonly owner: FieldRef<"PipelineTask", 'String'>
    readonly status: FieldRef<"PipelineTask", 'TaskStatus'>
    readonly startedAt: FieldRef<"PipelineTask", 'DateTime'>
    readonly completedAt: FieldRef<"PipelineTask", 'DateTime'>
    readonly stepOrder: FieldRef<"PipelineTask", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * PipelineTask findUnique
   */
  export type PipelineTaskFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineTask
     */
    select?: PipelineTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PipelineTask
     */
    omit?: PipelineTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineTaskInclude<ExtArgs> | null
    /**
     * Filter, which PipelineTask to fetch.
     */
    where: PipelineTaskWhereUniqueInput
  }

  /**
   * PipelineTask findUniqueOrThrow
   */
  export type PipelineTaskFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineTask
     */
    select?: PipelineTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PipelineTask
     */
    omit?: PipelineTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineTaskInclude<ExtArgs> | null
    /**
     * Filter, which PipelineTask to fetch.
     */
    where: PipelineTaskWhereUniqueInput
  }

  /**
   * PipelineTask findFirst
   */
  export type PipelineTaskFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineTask
     */
    select?: PipelineTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PipelineTask
     */
    omit?: PipelineTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineTaskInclude<ExtArgs> | null
    /**
     * Filter, which PipelineTask to fetch.
     */
    where?: PipelineTaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PipelineTasks to fetch.
     */
    orderBy?: PipelineTaskOrderByWithRelationInput | PipelineTaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PipelineTasks.
     */
    cursor?: PipelineTaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PipelineTasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PipelineTasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PipelineTasks.
     */
    distinct?: PipelineTaskScalarFieldEnum | PipelineTaskScalarFieldEnum[]
  }

  /**
   * PipelineTask findFirstOrThrow
   */
  export type PipelineTaskFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineTask
     */
    select?: PipelineTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PipelineTask
     */
    omit?: PipelineTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineTaskInclude<ExtArgs> | null
    /**
     * Filter, which PipelineTask to fetch.
     */
    where?: PipelineTaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PipelineTasks to fetch.
     */
    orderBy?: PipelineTaskOrderByWithRelationInput | PipelineTaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PipelineTasks.
     */
    cursor?: PipelineTaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PipelineTasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PipelineTasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PipelineTasks.
     */
    distinct?: PipelineTaskScalarFieldEnum | PipelineTaskScalarFieldEnum[]
  }

  /**
   * PipelineTask findMany
   */
  export type PipelineTaskFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineTask
     */
    select?: PipelineTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PipelineTask
     */
    omit?: PipelineTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineTaskInclude<ExtArgs> | null
    /**
     * Filter, which PipelineTasks to fetch.
     */
    where?: PipelineTaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PipelineTasks to fetch.
     */
    orderBy?: PipelineTaskOrderByWithRelationInput | PipelineTaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PipelineTasks.
     */
    cursor?: PipelineTaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PipelineTasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PipelineTasks.
     */
    skip?: number
    distinct?: PipelineTaskScalarFieldEnum | PipelineTaskScalarFieldEnum[]
  }

  /**
   * PipelineTask create
   */
  export type PipelineTaskCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineTask
     */
    select?: PipelineTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PipelineTask
     */
    omit?: PipelineTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineTaskInclude<ExtArgs> | null
    /**
     * The data needed to create a PipelineTask.
     */
    data: XOR<PipelineTaskCreateInput, PipelineTaskUncheckedCreateInput>
  }

  /**
   * PipelineTask createMany
   */
  export type PipelineTaskCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PipelineTasks.
     */
    data: PipelineTaskCreateManyInput | PipelineTaskCreateManyInput[]
  }

  /**
   * PipelineTask createManyAndReturn
   */
  export type PipelineTaskCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineTask
     */
    select?: PipelineTaskSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PipelineTask
     */
    omit?: PipelineTaskOmit<ExtArgs> | null
    /**
     * The data used to create many PipelineTasks.
     */
    data: PipelineTaskCreateManyInput | PipelineTaskCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineTaskIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PipelineTask update
   */
  export type PipelineTaskUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineTask
     */
    select?: PipelineTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PipelineTask
     */
    omit?: PipelineTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineTaskInclude<ExtArgs> | null
    /**
     * The data needed to update a PipelineTask.
     */
    data: XOR<PipelineTaskUpdateInput, PipelineTaskUncheckedUpdateInput>
    /**
     * Choose, which PipelineTask to update.
     */
    where: PipelineTaskWhereUniqueInput
  }

  /**
   * PipelineTask updateMany
   */
  export type PipelineTaskUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PipelineTasks.
     */
    data: XOR<PipelineTaskUpdateManyMutationInput, PipelineTaskUncheckedUpdateManyInput>
    /**
     * Filter which PipelineTasks to update
     */
    where?: PipelineTaskWhereInput
    /**
     * Limit how many PipelineTasks to update.
     */
    limit?: number
  }

  /**
   * PipelineTask updateManyAndReturn
   */
  export type PipelineTaskUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineTask
     */
    select?: PipelineTaskSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PipelineTask
     */
    omit?: PipelineTaskOmit<ExtArgs> | null
    /**
     * The data used to update PipelineTasks.
     */
    data: XOR<PipelineTaskUpdateManyMutationInput, PipelineTaskUncheckedUpdateManyInput>
    /**
     * Filter which PipelineTasks to update
     */
    where?: PipelineTaskWhereInput
    /**
     * Limit how many PipelineTasks to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineTaskIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PipelineTask upsert
   */
  export type PipelineTaskUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineTask
     */
    select?: PipelineTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PipelineTask
     */
    omit?: PipelineTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineTaskInclude<ExtArgs> | null
    /**
     * The filter to search for the PipelineTask to update in case it exists.
     */
    where: PipelineTaskWhereUniqueInput
    /**
     * In case the PipelineTask found by the `where` argument doesn't exist, create a new PipelineTask with this data.
     */
    create: XOR<PipelineTaskCreateInput, PipelineTaskUncheckedCreateInput>
    /**
     * In case the PipelineTask was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PipelineTaskUpdateInput, PipelineTaskUncheckedUpdateInput>
  }

  /**
   * PipelineTask delete
   */
  export type PipelineTaskDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineTask
     */
    select?: PipelineTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PipelineTask
     */
    omit?: PipelineTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineTaskInclude<ExtArgs> | null
    /**
     * Filter which PipelineTask to delete.
     */
    where: PipelineTaskWhereUniqueInput
  }

  /**
   * PipelineTask deleteMany
   */
  export type PipelineTaskDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PipelineTasks to delete
     */
    where?: PipelineTaskWhereInput
    /**
     * Limit how many PipelineTasks to delete.
     */
    limit?: number
  }

  /**
   * PipelineTask without action
   */
  export type PipelineTaskDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PipelineTask
     */
    select?: PipelineTaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PipelineTask
     */
    omit?: PipelineTaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PipelineTaskInclude<ExtArgs> | null
  }


  /**
   * Model AuditEvent
   */

  export type AggregateAuditEvent = {
    _count: AuditEventCountAggregateOutputType | null
    _min: AuditEventMinAggregateOutputType | null
    _max: AuditEventMaxAggregateOutputType | null
  }

  export type AuditEventMinAggregateOutputType = {
    id: string | null
    timestamp: Date | null
    actor: string | null
    orgId: string | null
    action: string | null
    target: string | null
  }

  export type AuditEventMaxAggregateOutputType = {
    id: string | null
    timestamp: Date | null
    actor: string | null
    orgId: string | null
    action: string | null
    target: string | null
  }

  export type AuditEventCountAggregateOutputType = {
    id: number
    timestamp: number
    actor: number
    orgId: number
    action: number
    target: number
    metadata: number
    _all: number
  }


  export type AuditEventMinAggregateInputType = {
    id?: true
    timestamp?: true
    actor?: true
    orgId?: true
    action?: true
    target?: true
  }

  export type AuditEventMaxAggregateInputType = {
    id?: true
    timestamp?: true
    actor?: true
    orgId?: true
    action?: true
    target?: true
  }

  export type AuditEventCountAggregateInputType = {
    id?: true
    timestamp?: true
    actor?: true
    orgId?: true
    action?: true
    target?: true
    metadata?: true
    _all?: true
  }

  export type AuditEventAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AuditEvent to aggregate.
     */
    where?: AuditEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditEvents to fetch.
     */
    orderBy?: AuditEventOrderByWithRelationInput | AuditEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AuditEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AuditEvents
    **/
    _count?: true | AuditEventCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AuditEventMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AuditEventMaxAggregateInputType
  }

  export type GetAuditEventAggregateType<T extends AuditEventAggregateArgs> = {
        [P in keyof T & keyof AggregateAuditEvent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAuditEvent[P]>
      : GetScalarType<T[P], AggregateAuditEvent[P]>
  }




  export type AuditEventGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AuditEventWhereInput
    orderBy?: AuditEventOrderByWithAggregationInput | AuditEventOrderByWithAggregationInput[]
    by: AuditEventScalarFieldEnum[] | AuditEventScalarFieldEnum
    having?: AuditEventScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AuditEventCountAggregateInputType | true
    _min?: AuditEventMinAggregateInputType
    _max?: AuditEventMaxAggregateInputType
  }

  export type AuditEventGroupByOutputType = {
    id: string
    timestamp: Date
    actor: string
    orgId: string
    action: string
    target: string | null
    metadata: JsonValue | null
    _count: AuditEventCountAggregateOutputType | null
    _min: AuditEventMinAggregateOutputType | null
    _max: AuditEventMaxAggregateOutputType | null
  }

  type GetAuditEventGroupByPayload<T extends AuditEventGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AuditEventGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AuditEventGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AuditEventGroupByOutputType[P]>
            : GetScalarType<T[P], AuditEventGroupByOutputType[P]>
        }
      >
    >


  export type AuditEventSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    timestamp?: boolean
    actor?: boolean
    orgId?: boolean
    action?: boolean
    target?: boolean
    metadata?: boolean
  }, ExtArgs["result"]["auditEvent"]>

  export type AuditEventSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    timestamp?: boolean
    actor?: boolean
    orgId?: boolean
    action?: boolean
    target?: boolean
    metadata?: boolean
  }, ExtArgs["result"]["auditEvent"]>

  export type AuditEventSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    timestamp?: boolean
    actor?: boolean
    orgId?: boolean
    action?: boolean
    target?: boolean
    metadata?: boolean
  }, ExtArgs["result"]["auditEvent"]>

  export type AuditEventSelectScalar = {
    id?: boolean
    timestamp?: boolean
    actor?: boolean
    orgId?: boolean
    action?: boolean
    target?: boolean
    metadata?: boolean
  }

  export type AuditEventOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "timestamp" | "actor" | "orgId" | "action" | "target" | "metadata", ExtArgs["result"]["auditEvent"]>

  export type $AuditEventPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AuditEvent"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      timestamp: Date
      actor: string
      orgId: string
      action: string
      target: string | null
      metadata: Prisma.JsonValue | null
    }, ExtArgs["result"]["auditEvent"]>
    composites: {}
  }

  type AuditEventGetPayload<S extends boolean | null | undefined | AuditEventDefaultArgs> = $Result.GetResult<Prisma.$AuditEventPayload, S>

  type AuditEventCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AuditEventFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AuditEventCountAggregateInputType | true
    }

  export interface AuditEventDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AuditEvent'], meta: { name: 'AuditEvent' } }
    /**
     * Find zero or one AuditEvent that matches the filter.
     * @param {AuditEventFindUniqueArgs} args - Arguments to find a AuditEvent
     * @example
     * // Get one AuditEvent
     * const auditEvent = await prisma.auditEvent.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AuditEventFindUniqueArgs>(args: SelectSubset<T, AuditEventFindUniqueArgs<ExtArgs>>): Prisma__AuditEventClient<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AuditEvent that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AuditEventFindUniqueOrThrowArgs} args - Arguments to find a AuditEvent
     * @example
     * // Get one AuditEvent
     * const auditEvent = await prisma.auditEvent.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AuditEventFindUniqueOrThrowArgs>(args: SelectSubset<T, AuditEventFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AuditEventClient<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AuditEvent that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditEventFindFirstArgs} args - Arguments to find a AuditEvent
     * @example
     * // Get one AuditEvent
     * const auditEvent = await prisma.auditEvent.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AuditEventFindFirstArgs>(args?: SelectSubset<T, AuditEventFindFirstArgs<ExtArgs>>): Prisma__AuditEventClient<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AuditEvent that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditEventFindFirstOrThrowArgs} args - Arguments to find a AuditEvent
     * @example
     * // Get one AuditEvent
     * const auditEvent = await prisma.auditEvent.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AuditEventFindFirstOrThrowArgs>(args?: SelectSubset<T, AuditEventFindFirstOrThrowArgs<ExtArgs>>): Prisma__AuditEventClient<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AuditEvents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditEventFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AuditEvents
     * const auditEvents = await prisma.auditEvent.findMany()
     * 
     * // Get first 10 AuditEvents
     * const auditEvents = await prisma.auditEvent.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const auditEventWithIdOnly = await prisma.auditEvent.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AuditEventFindManyArgs>(args?: SelectSubset<T, AuditEventFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AuditEvent.
     * @param {AuditEventCreateArgs} args - Arguments to create a AuditEvent.
     * @example
     * // Create one AuditEvent
     * const AuditEvent = await prisma.auditEvent.create({
     *   data: {
     *     // ... data to create a AuditEvent
     *   }
     * })
     * 
     */
    create<T extends AuditEventCreateArgs>(args: SelectSubset<T, AuditEventCreateArgs<ExtArgs>>): Prisma__AuditEventClient<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AuditEvents.
     * @param {AuditEventCreateManyArgs} args - Arguments to create many AuditEvents.
     * @example
     * // Create many AuditEvents
     * const auditEvent = await prisma.auditEvent.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AuditEventCreateManyArgs>(args?: SelectSubset<T, AuditEventCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AuditEvents and returns the data saved in the database.
     * @param {AuditEventCreateManyAndReturnArgs} args - Arguments to create many AuditEvents.
     * @example
     * // Create many AuditEvents
     * const auditEvent = await prisma.auditEvent.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AuditEvents and only return the `id`
     * const auditEventWithIdOnly = await prisma.auditEvent.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AuditEventCreateManyAndReturnArgs>(args?: SelectSubset<T, AuditEventCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AuditEvent.
     * @param {AuditEventDeleteArgs} args - Arguments to delete one AuditEvent.
     * @example
     * // Delete one AuditEvent
     * const AuditEvent = await prisma.auditEvent.delete({
     *   where: {
     *     // ... filter to delete one AuditEvent
     *   }
     * })
     * 
     */
    delete<T extends AuditEventDeleteArgs>(args: SelectSubset<T, AuditEventDeleteArgs<ExtArgs>>): Prisma__AuditEventClient<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AuditEvent.
     * @param {AuditEventUpdateArgs} args - Arguments to update one AuditEvent.
     * @example
     * // Update one AuditEvent
     * const auditEvent = await prisma.auditEvent.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AuditEventUpdateArgs>(args: SelectSubset<T, AuditEventUpdateArgs<ExtArgs>>): Prisma__AuditEventClient<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AuditEvents.
     * @param {AuditEventDeleteManyArgs} args - Arguments to filter AuditEvents to delete.
     * @example
     * // Delete a few AuditEvents
     * const { count } = await prisma.auditEvent.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AuditEventDeleteManyArgs>(args?: SelectSubset<T, AuditEventDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AuditEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditEventUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AuditEvents
     * const auditEvent = await prisma.auditEvent.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AuditEventUpdateManyArgs>(args: SelectSubset<T, AuditEventUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AuditEvents and returns the data updated in the database.
     * @param {AuditEventUpdateManyAndReturnArgs} args - Arguments to update many AuditEvents.
     * @example
     * // Update many AuditEvents
     * const auditEvent = await prisma.auditEvent.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AuditEvents and only return the `id`
     * const auditEventWithIdOnly = await prisma.auditEvent.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AuditEventUpdateManyAndReturnArgs>(args: SelectSubset<T, AuditEventUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AuditEvent.
     * @param {AuditEventUpsertArgs} args - Arguments to update or create a AuditEvent.
     * @example
     * // Update or create a AuditEvent
     * const auditEvent = await prisma.auditEvent.upsert({
     *   create: {
     *     // ... data to create a AuditEvent
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AuditEvent we want to update
     *   }
     * })
     */
    upsert<T extends AuditEventUpsertArgs>(args: SelectSubset<T, AuditEventUpsertArgs<ExtArgs>>): Prisma__AuditEventClient<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AuditEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditEventCountArgs} args - Arguments to filter AuditEvents to count.
     * @example
     * // Count the number of AuditEvents
     * const count = await prisma.auditEvent.count({
     *   where: {
     *     // ... the filter for the AuditEvents we want to count
     *   }
     * })
    **/
    count<T extends AuditEventCountArgs>(
      args?: Subset<T, AuditEventCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AuditEventCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AuditEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditEventAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AuditEventAggregateArgs>(args: Subset<T, AuditEventAggregateArgs>): Prisma.PrismaPromise<GetAuditEventAggregateType<T>>

    /**
     * Group by AuditEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditEventGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AuditEventGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AuditEventGroupByArgs['orderBy'] }
        : { orderBy?: AuditEventGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AuditEventGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAuditEventGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AuditEvent model
   */
  readonly fields: AuditEventFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AuditEvent.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AuditEventClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AuditEvent model
   */
  interface AuditEventFieldRefs {
    readonly id: FieldRef<"AuditEvent", 'String'>
    readonly timestamp: FieldRef<"AuditEvent", 'DateTime'>
    readonly actor: FieldRef<"AuditEvent", 'String'>
    readonly orgId: FieldRef<"AuditEvent", 'String'>
    readonly action: FieldRef<"AuditEvent", 'String'>
    readonly target: FieldRef<"AuditEvent", 'String'>
    readonly metadata: FieldRef<"AuditEvent", 'Json'>
  }
    

  // Custom InputTypes
  /**
   * AuditEvent findUnique
   */
  export type AuditEventFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * Filter, which AuditEvent to fetch.
     */
    where: AuditEventWhereUniqueInput
  }

  /**
   * AuditEvent findUniqueOrThrow
   */
  export type AuditEventFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * Filter, which AuditEvent to fetch.
     */
    where: AuditEventWhereUniqueInput
  }

  /**
   * AuditEvent findFirst
   */
  export type AuditEventFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * Filter, which AuditEvent to fetch.
     */
    where?: AuditEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditEvents to fetch.
     */
    orderBy?: AuditEventOrderByWithRelationInput | AuditEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AuditEvents.
     */
    cursor?: AuditEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AuditEvents.
     */
    distinct?: AuditEventScalarFieldEnum | AuditEventScalarFieldEnum[]
  }

  /**
   * AuditEvent findFirstOrThrow
   */
  export type AuditEventFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * Filter, which AuditEvent to fetch.
     */
    where?: AuditEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditEvents to fetch.
     */
    orderBy?: AuditEventOrderByWithRelationInput | AuditEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AuditEvents.
     */
    cursor?: AuditEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AuditEvents.
     */
    distinct?: AuditEventScalarFieldEnum | AuditEventScalarFieldEnum[]
  }

  /**
   * AuditEvent findMany
   */
  export type AuditEventFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * Filter, which AuditEvents to fetch.
     */
    where?: AuditEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditEvents to fetch.
     */
    orderBy?: AuditEventOrderByWithRelationInput | AuditEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AuditEvents.
     */
    cursor?: AuditEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditEvents.
     */
    skip?: number
    distinct?: AuditEventScalarFieldEnum | AuditEventScalarFieldEnum[]
  }

  /**
   * AuditEvent create
   */
  export type AuditEventCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * The data needed to create a AuditEvent.
     */
    data: XOR<AuditEventCreateInput, AuditEventUncheckedCreateInput>
  }

  /**
   * AuditEvent createMany
   */
  export type AuditEventCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AuditEvents.
     */
    data: AuditEventCreateManyInput | AuditEventCreateManyInput[]
  }

  /**
   * AuditEvent createManyAndReturn
   */
  export type AuditEventCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * The data used to create many AuditEvents.
     */
    data: AuditEventCreateManyInput | AuditEventCreateManyInput[]
  }

  /**
   * AuditEvent update
   */
  export type AuditEventUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * The data needed to update a AuditEvent.
     */
    data: XOR<AuditEventUpdateInput, AuditEventUncheckedUpdateInput>
    /**
     * Choose, which AuditEvent to update.
     */
    where: AuditEventWhereUniqueInput
  }

  /**
   * AuditEvent updateMany
   */
  export type AuditEventUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AuditEvents.
     */
    data: XOR<AuditEventUpdateManyMutationInput, AuditEventUncheckedUpdateManyInput>
    /**
     * Filter which AuditEvents to update
     */
    where?: AuditEventWhereInput
    /**
     * Limit how many AuditEvents to update.
     */
    limit?: number
  }

  /**
   * AuditEvent updateManyAndReturn
   */
  export type AuditEventUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * The data used to update AuditEvents.
     */
    data: XOR<AuditEventUpdateManyMutationInput, AuditEventUncheckedUpdateManyInput>
    /**
     * Filter which AuditEvents to update
     */
    where?: AuditEventWhereInput
    /**
     * Limit how many AuditEvents to update.
     */
    limit?: number
  }

  /**
   * AuditEvent upsert
   */
  export type AuditEventUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * The filter to search for the AuditEvent to update in case it exists.
     */
    where: AuditEventWhereUniqueInput
    /**
     * In case the AuditEvent found by the `where` argument doesn't exist, create a new AuditEvent with this data.
     */
    create: XOR<AuditEventCreateInput, AuditEventUncheckedCreateInput>
    /**
     * In case the AuditEvent was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AuditEventUpdateInput, AuditEventUncheckedUpdateInput>
  }

  /**
   * AuditEvent delete
   */
  export type AuditEventDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * Filter which AuditEvent to delete.
     */
    where: AuditEventWhereUniqueInput
  }

  /**
   * AuditEvent deleteMany
   */
  export type AuditEventDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AuditEvents to delete
     */
    where?: AuditEventWhereInput
    /**
     * Limit how many AuditEvents to delete.
     */
    limit?: number
  }

  /**
   * AuditEvent without action
   */
  export type AuditEventDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
  }


  /**
   * Model Agent
   */

  export type AggregateAgent = {
    _count: AgentCountAggregateOutputType | null
    _avg: AgentAvgAggregateOutputType | null
    _sum: AgentSumAggregateOutputType | null
    _min: AgentMinAggregateOutputType | null
    _max: AgentMaxAggregateOutputType | null
  }

  export type AgentAvgAggregateOutputType = {
    rating: number | null
  }

  export type AgentSumAggregateOutputType = {
    rating: number | null
  }

  export type AgentMinAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    version: string | null
    tags: string | null
    status: $Enums.AgentStatus | null
    author: string | null
    rating: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AgentMaxAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    version: string | null
    tags: string | null
    status: $Enums.AgentStatus | null
    author: string | null
    rating: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AgentCountAggregateOutputType = {
    id: number
    name: number
    description: number
    version: number
    tags: number
    status: number
    author: number
    rating: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type AgentAvgAggregateInputType = {
    rating?: true
  }

  export type AgentSumAggregateInputType = {
    rating?: true
  }

  export type AgentMinAggregateInputType = {
    id?: true
    name?: true
    description?: true
    version?: true
    tags?: true
    status?: true
    author?: true
    rating?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AgentMaxAggregateInputType = {
    id?: true
    name?: true
    description?: true
    version?: true
    tags?: true
    status?: true
    author?: true
    rating?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AgentCountAggregateInputType = {
    id?: true
    name?: true
    description?: true
    version?: true
    tags?: true
    status?: true
    author?: true
    rating?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type AgentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Agent to aggregate.
     */
    where?: AgentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Agents to fetch.
     */
    orderBy?: AgentOrderByWithRelationInput | AgentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AgentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Agents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Agents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Agents
    **/
    _count?: true | AgentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AgentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AgentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AgentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AgentMaxAggregateInputType
  }

  export type GetAgentAggregateType<T extends AgentAggregateArgs> = {
        [P in keyof T & keyof AggregateAgent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAgent[P]>
      : GetScalarType<T[P], AggregateAgent[P]>
  }




  export type AgentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AgentWhereInput
    orderBy?: AgentOrderByWithAggregationInput | AgentOrderByWithAggregationInput[]
    by: AgentScalarFieldEnum[] | AgentScalarFieldEnum
    having?: AgentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AgentCountAggregateInputType | true
    _avg?: AgentAvgAggregateInputType
    _sum?: AgentSumAggregateInputType
    _min?: AgentMinAggregateInputType
    _max?: AgentMaxAggregateInputType
  }

  export type AgentGroupByOutputType = {
    id: string
    name: string
    description: string
    version: string
    tags: string
    status: $Enums.AgentStatus
    author: string
    rating: number | null
    createdAt: Date
    updatedAt: Date
    _count: AgentCountAggregateOutputType | null
    _avg: AgentAvgAggregateOutputType | null
    _sum: AgentSumAggregateOutputType | null
    _min: AgentMinAggregateOutputType | null
    _max: AgentMaxAggregateOutputType | null
  }

  type GetAgentGroupByPayload<T extends AgentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AgentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AgentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AgentGroupByOutputType[P]>
            : GetScalarType<T[P], AgentGroupByOutputType[P]>
        }
      >
    >


  export type AgentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    version?: boolean
    tags?: boolean
    status?: boolean
    author?: boolean
    rating?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["agent"]>

  export type AgentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    version?: boolean
    tags?: boolean
    status?: boolean
    author?: boolean
    rating?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["agent"]>

  export type AgentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    version?: boolean
    tags?: boolean
    status?: boolean
    author?: boolean
    rating?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["agent"]>

  export type AgentSelectScalar = {
    id?: boolean
    name?: boolean
    description?: boolean
    version?: boolean
    tags?: boolean
    status?: boolean
    author?: boolean
    rating?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type AgentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "description" | "version" | "tags" | "status" | "author" | "rating" | "createdAt" | "updatedAt", ExtArgs["result"]["agent"]>

  export type $AgentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Agent"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      description: string
      version: string
      tags: string
      status: $Enums.AgentStatus
      author: string
      rating: number | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["agent"]>
    composites: {}
  }

  type AgentGetPayload<S extends boolean | null | undefined | AgentDefaultArgs> = $Result.GetResult<Prisma.$AgentPayload, S>

  type AgentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AgentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AgentCountAggregateInputType | true
    }

  export interface AgentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Agent'], meta: { name: 'Agent' } }
    /**
     * Find zero or one Agent that matches the filter.
     * @param {AgentFindUniqueArgs} args - Arguments to find a Agent
     * @example
     * // Get one Agent
     * const agent = await prisma.agent.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AgentFindUniqueArgs>(args: SelectSubset<T, AgentFindUniqueArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Agent that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AgentFindUniqueOrThrowArgs} args - Arguments to find a Agent
     * @example
     * // Get one Agent
     * const agent = await prisma.agent.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AgentFindUniqueOrThrowArgs>(args: SelectSubset<T, AgentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Agent that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentFindFirstArgs} args - Arguments to find a Agent
     * @example
     * // Get one Agent
     * const agent = await prisma.agent.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AgentFindFirstArgs>(args?: SelectSubset<T, AgentFindFirstArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Agent that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentFindFirstOrThrowArgs} args - Arguments to find a Agent
     * @example
     * // Get one Agent
     * const agent = await prisma.agent.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AgentFindFirstOrThrowArgs>(args?: SelectSubset<T, AgentFindFirstOrThrowArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Agents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Agents
     * const agents = await prisma.agent.findMany()
     * 
     * // Get first 10 Agents
     * const agents = await prisma.agent.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const agentWithIdOnly = await prisma.agent.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AgentFindManyArgs>(args?: SelectSubset<T, AgentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Agent.
     * @param {AgentCreateArgs} args - Arguments to create a Agent.
     * @example
     * // Create one Agent
     * const Agent = await prisma.agent.create({
     *   data: {
     *     // ... data to create a Agent
     *   }
     * })
     * 
     */
    create<T extends AgentCreateArgs>(args: SelectSubset<T, AgentCreateArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Agents.
     * @param {AgentCreateManyArgs} args - Arguments to create many Agents.
     * @example
     * // Create many Agents
     * const agent = await prisma.agent.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AgentCreateManyArgs>(args?: SelectSubset<T, AgentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Agents and returns the data saved in the database.
     * @param {AgentCreateManyAndReturnArgs} args - Arguments to create many Agents.
     * @example
     * // Create many Agents
     * const agent = await prisma.agent.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Agents and only return the `id`
     * const agentWithIdOnly = await prisma.agent.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AgentCreateManyAndReturnArgs>(args?: SelectSubset<T, AgentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Agent.
     * @param {AgentDeleteArgs} args - Arguments to delete one Agent.
     * @example
     * // Delete one Agent
     * const Agent = await prisma.agent.delete({
     *   where: {
     *     // ... filter to delete one Agent
     *   }
     * })
     * 
     */
    delete<T extends AgentDeleteArgs>(args: SelectSubset<T, AgentDeleteArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Agent.
     * @param {AgentUpdateArgs} args - Arguments to update one Agent.
     * @example
     * // Update one Agent
     * const agent = await prisma.agent.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AgentUpdateArgs>(args: SelectSubset<T, AgentUpdateArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Agents.
     * @param {AgentDeleteManyArgs} args - Arguments to filter Agents to delete.
     * @example
     * // Delete a few Agents
     * const { count } = await prisma.agent.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AgentDeleteManyArgs>(args?: SelectSubset<T, AgentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Agents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Agents
     * const agent = await prisma.agent.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AgentUpdateManyArgs>(args: SelectSubset<T, AgentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Agents and returns the data updated in the database.
     * @param {AgentUpdateManyAndReturnArgs} args - Arguments to update many Agents.
     * @example
     * // Update many Agents
     * const agent = await prisma.agent.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Agents and only return the `id`
     * const agentWithIdOnly = await prisma.agent.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AgentUpdateManyAndReturnArgs>(args: SelectSubset<T, AgentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Agent.
     * @param {AgentUpsertArgs} args - Arguments to update or create a Agent.
     * @example
     * // Update or create a Agent
     * const agent = await prisma.agent.upsert({
     *   create: {
     *     // ... data to create a Agent
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Agent we want to update
     *   }
     * })
     */
    upsert<T extends AgentUpsertArgs>(args: SelectSubset<T, AgentUpsertArgs<ExtArgs>>): Prisma__AgentClient<$Result.GetResult<Prisma.$AgentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Agents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentCountArgs} args - Arguments to filter Agents to count.
     * @example
     * // Count the number of Agents
     * const count = await prisma.agent.count({
     *   where: {
     *     // ... the filter for the Agents we want to count
     *   }
     * })
    **/
    count<T extends AgentCountArgs>(
      args?: Subset<T, AgentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AgentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Agent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AgentAggregateArgs>(args: Subset<T, AgentAggregateArgs>): Prisma.PrismaPromise<GetAgentAggregateType<T>>

    /**
     * Group by Agent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AgentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AgentGroupByArgs['orderBy'] }
        : { orderBy?: AgentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AgentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAgentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Agent model
   */
  readonly fields: AgentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Agent.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AgentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Agent model
   */
  interface AgentFieldRefs {
    readonly id: FieldRef<"Agent", 'String'>
    readonly name: FieldRef<"Agent", 'String'>
    readonly description: FieldRef<"Agent", 'String'>
    readonly version: FieldRef<"Agent", 'String'>
    readonly tags: FieldRef<"Agent", 'String'>
    readonly status: FieldRef<"Agent", 'AgentStatus'>
    readonly author: FieldRef<"Agent", 'String'>
    readonly rating: FieldRef<"Agent", 'Float'>
    readonly createdAt: FieldRef<"Agent", 'DateTime'>
    readonly updatedAt: FieldRef<"Agent", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Agent findUnique
   */
  export type AgentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * Filter, which Agent to fetch.
     */
    where: AgentWhereUniqueInput
  }

  /**
   * Agent findUniqueOrThrow
   */
  export type AgentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * Filter, which Agent to fetch.
     */
    where: AgentWhereUniqueInput
  }

  /**
   * Agent findFirst
   */
  export type AgentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * Filter, which Agent to fetch.
     */
    where?: AgentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Agents to fetch.
     */
    orderBy?: AgentOrderByWithRelationInput | AgentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Agents.
     */
    cursor?: AgentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Agents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Agents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Agents.
     */
    distinct?: AgentScalarFieldEnum | AgentScalarFieldEnum[]
  }

  /**
   * Agent findFirstOrThrow
   */
  export type AgentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * Filter, which Agent to fetch.
     */
    where?: AgentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Agents to fetch.
     */
    orderBy?: AgentOrderByWithRelationInput | AgentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Agents.
     */
    cursor?: AgentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Agents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Agents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Agents.
     */
    distinct?: AgentScalarFieldEnum | AgentScalarFieldEnum[]
  }

  /**
   * Agent findMany
   */
  export type AgentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * Filter, which Agents to fetch.
     */
    where?: AgentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Agents to fetch.
     */
    orderBy?: AgentOrderByWithRelationInput | AgentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Agents.
     */
    cursor?: AgentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Agents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Agents.
     */
    skip?: number
    distinct?: AgentScalarFieldEnum | AgentScalarFieldEnum[]
  }

  /**
   * Agent create
   */
  export type AgentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * The data needed to create a Agent.
     */
    data: XOR<AgentCreateInput, AgentUncheckedCreateInput>
  }

  /**
   * Agent createMany
   */
  export type AgentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Agents.
     */
    data: AgentCreateManyInput | AgentCreateManyInput[]
  }

  /**
   * Agent createManyAndReturn
   */
  export type AgentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * The data used to create many Agents.
     */
    data: AgentCreateManyInput | AgentCreateManyInput[]
  }

  /**
   * Agent update
   */
  export type AgentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * The data needed to update a Agent.
     */
    data: XOR<AgentUpdateInput, AgentUncheckedUpdateInput>
    /**
     * Choose, which Agent to update.
     */
    where: AgentWhereUniqueInput
  }

  /**
   * Agent updateMany
   */
  export type AgentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Agents.
     */
    data: XOR<AgentUpdateManyMutationInput, AgentUncheckedUpdateManyInput>
    /**
     * Filter which Agents to update
     */
    where?: AgentWhereInput
    /**
     * Limit how many Agents to update.
     */
    limit?: number
  }

  /**
   * Agent updateManyAndReturn
   */
  export type AgentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * The data used to update Agents.
     */
    data: XOR<AgentUpdateManyMutationInput, AgentUncheckedUpdateManyInput>
    /**
     * Filter which Agents to update
     */
    where?: AgentWhereInput
    /**
     * Limit how many Agents to update.
     */
    limit?: number
  }

  /**
   * Agent upsert
   */
  export type AgentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * The filter to search for the Agent to update in case it exists.
     */
    where: AgentWhereUniqueInput
    /**
     * In case the Agent found by the `where` argument doesn't exist, create a new Agent with this data.
     */
    create: XOR<AgentCreateInput, AgentUncheckedCreateInput>
    /**
     * In case the Agent was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AgentUpdateInput, AgentUncheckedUpdateInput>
  }

  /**
   * Agent delete
   */
  export type AgentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
    /**
     * Filter which Agent to delete.
     */
    where: AgentWhereUniqueInput
  }

  /**
   * Agent deleteMany
   */
  export type AgentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Agents to delete
     */
    where?: AgentWhereInput
    /**
     * Limit how many Agents to delete.
     */
    limit?: number
  }

  /**
   * Agent without action
   */
  export type AgentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agent
     */
    select?: AgentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Agent
     */
    omit?: AgentOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const PipelineScalarFieldEnum: {
    id: 'id',
    orgId: 'orgId',
    name: 'name',
    description: 'description',
    owner: 'owner',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PipelineScalarFieldEnum = (typeof PipelineScalarFieldEnum)[keyof typeof PipelineScalarFieldEnum]


  export const PipelineTaskScalarFieldEnum: {
    id: 'id',
    pipelineId: 'pipelineId',
    name: 'name',
    owner: 'owner',
    status: 'status',
    startedAt: 'startedAt',
    completedAt: 'completedAt',
    stepOrder: 'stepOrder'
  };

  export type PipelineTaskScalarFieldEnum = (typeof PipelineTaskScalarFieldEnum)[keyof typeof PipelineTaskScalarFieldEnum]


  export const AuditEventScalarFieldEnum: {
    id: 'id',
    timestamp: 'timestamp',
    actor: 'actor',
    orgId: 'orgId',
    action: 'action',
    target: 'target',
    metadata: 'metadata'
  };

  export type AuditEventScalarFieldEnum = (typeof AuditEventScalarFieldEnum)[keyof typeof AuditEventScalarFieldEnum]


  export const AgentScalarFieldEnum: {
    id: 'id',
    name: 'name',
    description: 'description',
    version: 'version',
    tags: 'tags',
    status: 'status',
    author: 'author',
    rating: 'rating',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type AgentScalarFieldEnum = (typeof AgentScalarFieldEnum)[keyof typeof AgentScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'PipelineStatus'
   */
  export type EnumPipelineStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PipelineStatus'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'TaskStatus'
   */
  export type EnumTaskStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TaskStatus'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'AgentStatus'
   */
  export type EnumAgentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AgentStatus'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type PipelineWhereInput = {
    AND?: PipelineWhereInput | PipelineWhereInput[]
    OR?: PipelineWhereInput[]
    NOT?: PipelineWhereInput | PipelineWhereInput[]
    id?: StringFilter<"Pipeline"> | string
    orgId?: StringFilter<"Pipeline"> | string
    name?: StringFilter<"Pipeline"> | string
    description?: StringNullableFilter<"Pipeline"> | string | null
    owner?: StringFilter<"Pipeline"> | string
    status?: EnumPipelineStatusFilter<"Pipeline"> | $Enums.PipelineStatus
    createdAt?: DateTimeFilter<"Pipeline"> | Date | string
    updatedAt?: DateTimeFilter<"Pipeline"> | Date | string
    tasks?: PipelineTaskListRelationFilter
  }

  export type PipelineOrderByWithRelationInput = {
    id?: SortOrder
    orgId?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    owner?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    tasks?: PipelineTaskOrderByRelationAggregateInput
  }

  export type PipelineWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PipelineWhereInput | PipelineWhereInput[]
    OR?: PipelineWhereInput[]
    NOT?: PipelineWhereInput | PipelineWhereInput[]
    orgId?: StringFilter<"Pipeline"> | string
    name?: StringFilter<"Pipeline"> | string
    description?: StringNullableFilter<"Pipeline"> | string | null
    owner?: StringFilter<"Pipeline"> | string
    status?: EnumPipelineStatusFilter<"Pipeline"> | $Enums.PipelineStatus
    createdAt?: DateTimeFilter<"Pipeline"> | Date | string
    updatedAt?: DateTimeFilter<"Pipeline"> | Date | string
    tasks?: PipelineTaskListRelationFilter
  }, "id">

  export type PipelineOrderByWithAggregationInput = {
    id?: SortOrder
    orgId?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    owner?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PipelineCountOrderByAggregateInput
    _max?: PipelineMaxOrderByAggregateInput
    _min?: PipelineMinOrderByAggregateInput
  }

  export type PipelineScalarWhereWithAggregatesInput = {
    AND?: PipelineScalarWhereWithAggregatesInput | PipelineScalarWhereWithAggregatesInput[]
    OR?: PipelineScalarWhereWithAggregatesInput[]
    NOT?: PipelineScalarWhereWithAggregatesInput | PipelineScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Pipeline"> | string
    orgId?: StringWithAggregatesFilter<"Pipeline"> | string
    name?: StringWithAggregatesFilter<"Pipeline"> | string
    description?: StringNullableWithAggregatesFilter<"Pipeline"> | string | null
    owner?: StringWithAggregatesFilter<"Pipeline"> | string
    status?: EnumPipelineStatusWithAggregatesFilter<"Pipeline"> | $Enums.PipelineStatus
    createdAt?: DateTimeWithAggregatesFilter<"Pipeline"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Pipeline"> | Date | string
  }

  export type PipelineTaskWhereInput = {
    AND?: PipelineTaskWhereInput | PipelineTaskWhereInput[]
    OR?: PipelineTaskWhereInput[]
    NOT?: PipelineTaskWhereInput | PipelineTaskWhereInput[]
    id?: StringFilter<"PipelineTask"> | string
    pipelineId?: StringFilter<"PipelineTask"> | string
    name?: StringFilter<"PipelineTask"> | string
    owner?: StringFilter<"PipelineTask"> | string
    status?: EnumTaskStatusFilter<"PipelineTask"> | $Enums.TaskStatus
    startedAt?: DateTimeNullableFilter<"PipelineTask"> | Date | string | null
    completedAt?: DateTimeNullableFilter<"PipelineTask"> | Date | string | null
    stepOrder?: IntFilter<"PipelineTask"> | number
    pipeline?: XOR<PipelineScalarRelationFilter, PipelineWhereInput>
  }

  export type PipelineTaskOrderByWithRelationInput = {
    id?: SortOrder
    pipelineId?: SortOrder
    name?: SortOrder
    owner?: SortOrder
    status?: SortOrder
    startedAt?: SortOrderInput | SortOrder
    completedAt?: SortOrderInput | SortOrder
    stepOrder?: SortOrder
    pipeline?: PipelineOrderByWithRelationInput
  }

  export type PipelineTaskWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PipelineTaskWhereInput | PipelineTaskWhereInput[]
    OR?: PipelineTaskWhereInput[]
    NOT?: PipelineTaskWhereInput | PipelineTaskWhereInput[]
    pipelineId?: StringFilter<"PipelineTask"> | string
    name?: StringFilter<"PipelineTask"> | string
    owner?: StringFilter<"PipelineTask"> | string
    status?: EnumTaskStatusFilter<"PipelineTask"> | $Enums.TaskStatus
    startedAt?: DateTimeNullableFilter<"PipelineTask"> | Date | string | null
    completedAt?: DateTimeNullableFilter<"PipelineTask"> | Date | string | null
    stepOrder?: IntFilter<"PipelineTask"> | number
    pipeline?: XOR<PipelineScalarRelationFilter, PipelineWhereInput>
  }, "id">

  export type PipelineTaskOrderByWithAggregationInput = {
    id?: SortOrder
    pipelineId?: SortOrder
    name?: SortOrder
    owner?: SortOrder
    status?: SortOrder
    startedAt?: SortOrderInput | SortOrder
    completedAt?: SortOrderInput | SortOrder
    stepOrder?: SortOrder
    _count?: PipelineTaskCountOrderByAggregateInput
    _avg?: PipelineTaskAvgOrderByAggregateInput
    _max?: PipelineTaskMaxOrderByAggregateInput
    _min?: PipelineTaskMinOrderByAggregateInput
    _sum?: PipelineTaskSumOrderByAggregateInput
  }

  export type PipelineTaskScalarWhereWithAggregatesInput = {
    AND?: PipelineTaskScalarWhereWithAggregatesInput | PipelineTaskScalarWhereWithAggregatesInput[]
    OR?: PipelineTaskScalarWhereWithAggregatesInput[]
    NOT?: PipelineTaskScalarWhereWithAggregatesInput | PipelineTaskScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PipelineTask"> | string
    pipelineId?: StringWithAggregatesFilter<"PipelineTask"> | string
    name?: StringWithAggregatesFilter<"PipelineTask"> | string
    owner?: StringWithAggregatesFilter<"PipelineTask"> | string
    status?: EnumTaskStatusWithAggregatesFilter<"PipelineTask"> | $Enums.TaskStatus
    startedAt?: DateTimeNullableWithAggregatesFilter<"PipelineTask"> | Date | string | null
    completedAt?: DateTimeNullableWithAggregatesFilter<"PipelineTask"> | Date | string | null
    stepOrder?: IntWithAggregatesFilter<"PipelineTask"> | number
  }

  export type AuditEventWhereInput = {
    AND?: AuditEventWhereInput | AuditEventWhereInput[]
    OR?: AuditEventWhereInput[]
    NOT?: AuditEventWhereInput | AuditEventWhereInput[]
    id?: StringFilter<"AuditEvent"> | string
    timestamp?: DateTimeFilter<"AuditEvent"> | Date | string
    actor?: StringFilter<"AuditEvent"> | string
    orgId?: StringFilter<"AuditEvent"> | string
    action?: StringFilter<"AuditEvent"> | string
    target?: StringNullableFilter<"AuditEvent"> | string | null
    metadata?: JsonNullableFilter<"AuditEvent">
  }

  export type AuditEventOrderByWithRelationInput = {
    id?: SortOrder
    timestamp?: SortOrder
    actor?: SortOrder
    orgId?: SortOrder
    action?: SortOrder
    target?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
  }

  export type AuditEventWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AuditEventWhereInput | AuditEventWhereInput[]
    OR?: AuditEventWhereInput[]
    NOT?: AuditEventWhereInput | AuditEventWhereInput[]
    timestamp?: DateTimeFilter<"AuditEvent"> | Date | string
    actor?: StringFilter<"AuditEvent"> | string
    orgId?: StringFilter<"AuditEvent"> | string
    action?: StringFilter<"AuditEvent"> | string
    target?: StringNullableFilter<"AuditEvent"> | string | null
    metadata?: JsonNullableFilter<"AuditEvent">
  }, "id">

  export type AuditEventOrderByWithAggregationInput = {
    id?: SortOrder
    timestamp?: SortOrder
    actor?: SortOrder
    orgId?: SortOrder
    action?: SortOrder
    target?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    _count?: AuditEventCountOrderByAggregateInput
    _max?: AuditEventMaxOrderByAggregateInput
    _min?: AuditEventMinOrderByAggregateInput
  }

  export type AuditEventScalarWhereWithAggregatesInput = {
    AND?: AuditEventScalarWhereWithAggregatesInput | AuditEventScalarWhereWithAggregatesInput[]
    OR?: AuditEventScalarWhereWithAggregatesInput[]
    NOT?: AuditEventScalarWhereWithAggregatesInput | AuditEventScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AuditEvent"> | string
    timestamp?: DateTimeWithAggregatesFilter<"AuditEvent"> | Date | string
    actor?: StringWithAggregatesFilter<"AuditEvent"> | string
    orgId?: StringWithAggregatesFilter<"AuditEvent"> | string
    action?: StringWithAggregatesFilter<"AuditEvent"> | string
    target?: StringNullableWithAggregatesFilter<"AuditEvent"> | string | null
    metadata?: JsonNullableWithAggregatesFilter<"AuditEvent">
  }

  export type AgentWhereInput = {
    AND?: AgentWhereInput | AgentWhereInput[]
    OR?: AgentWhereInput[]
    NOT?: AgentWhereInput | AgentWhereInput[]
    id?: StringFilter<"Agent"> | string
    name?: StringFilter<"Agent"> | string
    description?: StringFilter<"Agent"> | string
    version?: StringFilter<"Agent"> | string
    tags?: StringFilter<"Agent"> | string
    status?: EnumAgentStatusFilter<"Agent"> | $Enums.AgentStatus
    author?: StringFilter<"Agent"> | string
    rating?: FloatNullableFilter<"Agent"> | number | null
    createdAt?: DateTimeFilter<"Agent"> | Date | string
    updatedAt?: DateTimeFilter<"Agent"> | Date | string
  }

  export type AgentOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    version?: SortOrder
    tags?: SortOrder
    status?: SortOrder
    author?: SortOrder
    rating?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AgentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AgentWhereInput | AgentWhereInput[]
    OR?: AgentWhereInput[]
    NOT?: AgentWhereInput | AgentWhereInput[]
    name?: StringFilter<"Agent"> | string
    description?: StringFilter<"Agent"> | string
    version?: StringFilter<"Agent"> | string
    tags?: StringFilter<"Agent"> | string
    status?: EnumAgentStatusFilter<"Agent"> | $Enums.AgentStatus
    author?: StringFilter<"Agent"> | string
    rating?: FloatNullableFilter<"Agent"> | number | null
    createdAt?: DateTimeFilter<"Agent"> | Date | string
    updatedAt?: DateTimeFilter<"Agent"> | Date | string
  }, "id">

  export type AgentOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    version?: SortOrder
    tags?: SortOrder
    status?: SortOrder
    author?: SortOrder
    rating?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: AgentCountOrderByAggregateInput
    _avg?: AgentAvgOrderByAggregateInput
    _max?: AgentMaxOrderByAggregateInput
    _min?: AgentMinOrderByAggregateInput
    _sum?: AgentSumOrderByAggregateInput
  }

  export type AgentScalarWhereWithAggregatesInput = {
    AND?: AgentScalarWhereWithAggregatesInput | AgentScalarWhereWithAggregatesInput[]
    OR?: AgentScalarWhereWithAggregatesInput[]
    NOT?: AgentScalarWhereWithAggregatesInput | AgentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Agent"> | string
    name?: StringWithAggregatesFilter<"Agent"> | string
    description?: StringWithAggregatesFilter<"Agent"> | string
    version?: StringWithAggregatesFilter<"Agent"> | string
    tags?: StringWithAggregatesFilter<"Agent"> | string
    status?: EnumAgentStatusWithAggregatesFilter<"Agent"> | $Enums.AgentStatus
    author?: StringWithAggregatesFilter<"Agent"> | string
    rating?: FloatNullableWithAggregatesFilter<"Agent"> | number | null
    createdAt?: DateTimeWithAggregatesFilter<"Agent"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Agent"> | Date | string
  }

  export type PipelineCreateInput = {
    id?: string
    orgId: string
    name: string
    description?: string | null
    owner: string
    status?: $Enums.PipelineStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    tasks?: PipelineTaskCreateNestedManyWithoutPipelineInput
  }

  export type PipelineUncheckedCreateInput = {
    id?: string
    orgId: string
    name: string
    description?: string | null
    owner: string
    status?: $Enums.PipelineStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    tasks?: PipelineTaskUncheckedCreateNestedManyWithoutPipelineInput
  }

  export type PipelineUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    orgId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    owner?: StringFieldUpdateOperationsInput | string
    status?: EnumPipelineStatusFieldUpdateOperationsInput | $Enums.PipelineStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tasks?: PipelineTaskUpdateManyWithoutPipelineNestedInput
  }

  export type PipelineUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    orgId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    owner?: StringFieldUpdateOperationsInput | string
    status?: EnumPipelineStatusFieldUpdateOperationsInput | $Enums.PipelineStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tasks?: PipelineTaskUncheckedUpdateManyWithoutPipelineNestedInput
  }

  export type PipelineCreateManyInput = {
    id?: string
    orgId: string
    name: string
    description?: string | null
    owner: string
    status?: $Enums.PipelineStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PipelineUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    orgId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    owner?: StringFieldUpdateOperationsInput | string
    status?: EnumPipelineStatusFieldUpdateOperationsInput | $Enums.PipelineStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PipelineUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    orgId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    owner?: StringFieldUpdateOperationsInput | string
    status?: EnumPipelineStatusFieldUpdateOperationsInput | $Enums.PipelineStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PipelineTaskCreateInput = {
    id?: string
    name: string
    owner: string
    status?: $Enums.TaskStatus
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    stepOrder?: number
    pipeline: PipelineCreateNestedOneWithoutTasksInput
  }

  export type PipelineTaskUncheckedCreateInput = {
    id?: string
    pipelineId: string
    name: string
    owner: string
    status?: $Enums.TaskStatus
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    stepOrder?: number
  }

  export type PipelineTaskUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    owner?: StringFieldUpdateOperationsInput | string
    status?: EnumTaskStatusFieldUpdateOperationsInput | $Enums.TaskStatus
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stepOrder?: IntFieldUpdateOperationsInput | number
    pipeline?: PipelineUpdateOneRequiredWithoutTasksNestedInput
  }

  export type PipelineTaskUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    pipelineId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    owner?: StringFieldUpdateOperationsInput | string
    status?: EnumTaskStatusFieldUpdateOperationsInput | $Enums.TaskStatus
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stepOrder?: IntFieldUpdateOperationsInput | number
  }

  export type PipelineTaskCreateManyInput = {
    id?: string
    pipelineId: string
    name: string
    owner: string
    status?: $Enums.TaskStatus
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    stepOrder?: number
  }

  export type PipelineTaskUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    owner?: StringFieldUpdateOperationsInput | string
    status?: EnumTaskStatusFieldUpdateOperationsInput | $Enums.TaskStatus
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stepOrder?: IntFieldUpdateOperationsInput | number
  }

  export type PipelineTaskUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    pipelineId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    owner?: StringFieldUpdateOperationsInput | string
    status?: EnumTaskStatusFieldUpdateOperationsInput | $Enums.TaskStatus
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stepOrder?: IntFieldUpdateOperationsInput | number
  }

  export type AuditEventCreateInput = {
    id?: string
    timestamp?: Date | string
    actor: string
    orgId: string
    action: string
    target?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type AuditEventUncheckedCreateInput = {
    id?: string
    timestamp?: Date | string
    actor: string
    orgId: string
    action: string
    target?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type AuditEventUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    actor?: StringFieldUpdateOperationsInput | string
    orgId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    target?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type AuditEventUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    actor?: StringFieldUpdateOperationsInput | string
    orgId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    target?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type AuditEventCreateManyInput = {
    id?: string
    timestamp?: Date | string
    actor: string
    orgId: string
    action: string
    target?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type AuditEventUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    actor?: StringFieldUpdateOperationsInput | string
    orgId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    target?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type AuditEventUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    actor?: StringFieldUpdateOperationsInput | string
    orgId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    target?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type AgentCreateInput = {
    id?: string
    name: string
    description: string
    version: string
    tags?: string
    status?: $Enums.AgentStatus
    author: string
    rating?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AgentUncheckedCreateInput = {
    id?: string
    name: string
    description: string
    version: string
    tags?: string
    status?: $Enums.AgentStatus
    author: string
    rating?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AgentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    tags?: StringFieldUpdateOperationsInput | string
    status?: EnumAgentStatusFieldUpdateOperationsInput | $Enums.AgentStatus
    author?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AgentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    tags?: StringFieldUpdateOperationsInput | string
    status?: EnumAgentStatusFieldUpdateOperationsInput | $Enums.AgentStatus
    author?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AgentCreateManyInput = {
    id?: string
    name: string
    description: string
    version: string
    tags?: string
    status?: $Enums.AgentStatus
    author: string
    rating?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AgentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    tags?: StringFieldUpdateOperationsInput | string
    status?: EnumAgentStatusFieldUpdateOperationsInput | $Enums.AgentStatus
    author?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AgentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    tags?: StringFieldUpdateOperationsInput | string
    status?: EnumAgentStatusFieldUpdateOperationsInput | $Enums.AgentStatus
    author?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumPipelineStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PipelineStatus | EnumPipelineStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PipelineStatus[]
    notIn?: $Enums.PipelineStatus[]
    not?: NestedEnumPipelineStatusFilter<$PrismaModel> | $Enums.PipelineStatus
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type PipelineTaskListRelationFilter = {
    every?: PipelineTaskWhereInput
    some?: PipelineTaskWhereInput
    none?: PipelineTaskWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type PipelineTaskOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PipelineCountOrderByAggregateInput = {
    id?: SortOrder
    orgId?: SortOrder
    name?: SortOrder
    description?: SortOrder
    owner?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PipelineMaxOrderByAggregateInput = {
    id?: SortOrder
    orgId?: SortOrder
    name?: SortOrder
    description?: SortOrder
    owner?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PipelineMinOrderByAggregateInput = {
    id?: SortOrder
    orgId?: SortOrder
    name?: SortOrder
    description?: SortOrder
    owner?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumPipelineStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PipelineStatus | EnumPipelineStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PipelineStatus[]
    notIn?: $Enums.PipelineStatus[]
    not?: NestedEnumPipelineStatusWithAggregatesFilter<$PrismaModel> | $Enums.PipelineStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPipelineStatusFilter<$PrismaModel>
    _max?: NestedEnumPipelineStatusFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumTaskStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.TaskStatus | EnumTaskStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TaskStatus[]
    notIn?: $Enums.TaskStatus[]
    not?: NestedEnumTaskStatusFilter<$PrismaModel> | $Enums.TaskStatus
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type PipelineScalarRelationFilter = {
    is?: PipelineWhereInput
    isNot?: PipelineWhereInput
  }

  export type PipelineTaskCountOrderByAggregateInput = {
    id?: SortOrder
    pipelineId?: SortOrder
    name?: SortOrder
    owner?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    stepOrder?: SortOrder
  }

  export type PipelineTaskAvgOrderByAggregateInput = {
    stepOrder?: SortOrder
  }

  export type PipelineTaskMaxOrderByAggregateInput = {
    id?: SortOrder
    pipelineId?: SortOrder
    name?: SortOrder
    owner?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    stepOrder?: SortOrder
  }

  export type PipelineTaskMinOrderByAggregateInput = {
    id?: SortOrder
    pipelineId?: SortOrder
    name?: SortOrder
    owner?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    stepOrder?: SortOrder
  }

  export type PipelineTaskSumOrderByAggregateInput = {
    stepOrder?: SortOrder
  }

  export type EnumTaskStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TaskStatus | EnumTaskStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TaskStatus[]
    notIn?: $Enums.TaskStatus[]
    not?: NestedEnumTaskStatusWithAggregatesFilter<$PrismaModel> | $Enums.TaskStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTaskStatusFilter<$PrismaModel>
    _max?: NestedEnumTaskStatusFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type AuditEventCountOrderByAggregateInput = {
    id?: SortOrder
    timestamp?: SortOrder
    actor?: SortOrder
    orgId?: SortOrder
    action?: SortOrder
    target?: SortOrder
    metadata?: SortOrder
  }

  export type AuditEventMaxOrderByAggregateInput = {
    id?: SortOrder
    timestamp?: SortOrder
    actor?: SortOrder
    orgId?: SortOrder
    action?: SortOrder
    target?: SortOrder
  }

  export type AuditEventMinOrderByAggregateInput = {
    id?: SortOrder
    timestamp?: SortOrder
    actor?: SortOrder
    orgId?: SortOrder
    action?: SortOrder
    target?: SortOrder
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type EnumAgentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.AgentStatus | EnumAgentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AgentStatus[]
    notIn?: $Enums.AgentStatus[]
    not?: NestedEnumAgentStatusFilter<$PrismaModel> | $Enums.AgentStatus
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type AgentCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    version?: SortOrder
    tags?: SortOrder
    status?: SortOrder
    author?: SortOrder
    rating?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AgentAvgOrderByAggregateInput = {
    rating?: SortOrder
  }

  export type AgentMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    version?: SortOrder
    tags?: SortOrder
    status?: SortOrder
    author?: SortOrder
    rating?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AgentMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    version?: SortOrder
    tags?: SortOrder
    status?: SortOrder
    author?: SortOrder
    rating?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AgentSumOrderByAggregateInput = {
    rating?: SortOrder
  }

  export type EnumAgentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AgentStatus | EnumAgentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AgentStatus[]
    notIn?: $Enums.AgentStatus[]
    not?: NestedEnumAgentStatusWithAggregatesFilter<$PrismaModel> | $Enums.AgentStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAgentStatusFilter<$PrismaModel>
    _max?: NestedEnumAgentStatusFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type PipelineTaskCreateNestedManyWithoutPipelineInput = {
    create?: XOR<PipelineTaskCreateWithoutPipelineInput, PipelineTaskUncheckedCreateWithoutPipelineInput> | PipelineTaskCreateWithoutPipelineInput[] | PipelineTaskUncheckedCreateWithoutPipelineInput[]
    connectOrCreate?: PipelineTaskCreateOrConnectWithoutPipelineInput | PipelineTaskCreateOrConnectWithoutPipelineInput[]
    createMany?: PipelineTaskCreateManyPipelineInputEnvelope
    connect?: PipelineTaskWhereUniqueInput | PipelineTaskWhereUniqueInput[]
  }

  export type PipelineTaskUncheckedCreateNestedManyWithoutPipelineInput = {
    create?: XOR<PipelineTaskCreateWithoutPipelineInput, PipelineTaskUncheckedCreateWithoutPipelineInput> | PipelineTaskCreateWithoutPipelineInput[] | PipelineTaskUncheckedCreateWithoutPipelineInput[]
    connectOrCreate?: PipelineTaskCreateOrConnectWithoutPipelineInput | PipelineTaskCreateOrConnectWithoutPipelineInput[]
    createMany?: PipelineTaskCreateManyPipelineInputEnvelope
    connect?: PipelineTaskWhereUniqueInput | PipelineTaskWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumPipelineStatusFieldUpdateOperationsInput = {
    set?: $Enums.PipelineStatus
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type PipelineTaskUpdateManyWithoutPipelineNestedInput = {
    create?: XOR<PipelineTaskCreateWithoutPipelineInput, PipelineTaskUncheckedCreateWithoutPipelineInput> | PipelineTaskCreateWithoutPipelineInput[] | PipelineTaskUncheckedCreateWithoutPipelineInput[]
    connectOrCreate?: PipelineTaskCreateOrConnectWithoutPipelineInput | PipelineTaskCreateOrConnectWithoutPipelineInput[]
    upsert?: PipelineTaskUpsertWithWhereUniqueWithoutPipelineInput | PipelineTaskUpsertWithWhereUniqueWithoutPipelineInput[]
    createMany?: PipelineTaskCreateManyPipelineInputEnvelope
    set?: PipelineTaskWhereUniqueInput | PipelineTaskWhereUniqueInput[]
    disconnect?: PipelineTaskWhereUniqueInput | PipelineTaskWhereUniqueInput[]
    delete?: PipelineTaskWhereUniqueInput | PipelineTaskWhereUniqueInput[]
    connect?: PipelineTaskWhereUniqueInput | PipelineTaskWhereUniqueInput[]
    update?: PipelineTaskUpdateWithWhereUniqueWithoutPipelineInput | PipelineTaskUpdateWithWhereUniqueWithoutPipelineInput[]
    updateMany?: PipelineTaskUpdateManyWithWhereWithoutPipelineInput | PipelineTaskUpdateManyWithWhereWithoutPipelineInput[]
    deleteMany?: PipelineTaskScalarWhereInput | PipelineTaskScalarWhereInput[]
  }

  export type PipelineTaskUncheckedUpdateManyWithoutPipelineNestedInput = {
    create?: XOR<PipelineTaskCreateWithoutPipelineInput, PipelineTaskUncheckedCreateWithoutPipelineInput> | PipelineTaskCreateWithoutPipelineInput[] | PipelineTaskUncheckedCreateWithoutPipelineInput[]
    connectOrCreate?: PipelineTaskCreateOrConnectWithoutPipelineInput | PipelineTaskCreateOrConnectWithoutPipelineInput[]
    upsert?: PipelineTaskUpsertWithWhereUniqueWithoutPipelineInput | PipelineTaskUpsertWithWhereUniqueWithoutPipelineInput[]
    createMany?: PipelineTaskCreateManyPipelineInputEnvelope
    set?: PipelineTaskWhereUniqueInput | PipelineTaskWhereUniqueInput[]
    disconnect?: PipelineTaskWhereUniqueInput | PipelineTaskWhereUniqueInput[]
    delete?: PipelineTaskWhereUniqueInput | PipelineTaskWhereUniqueInput[]
    connect?: PipelineTaskWhereUniqueInput | PipelineTaskWhereUniqueInput[]
    update?: PipelineTaskUpdateWithWhereUniqueWithoutPipelineInput | PipelineTaskUpdateWithWhereUniqueWithoutPipelineInput[]
    updateMany?: PipelineTaskUpdateManyWithWhereWithoutPipelineInput | PipelineTaskUpdateManyWithWhereWithoutPipelineInput[]
    deleteMany?: PipelineTaskScalarWhereInput | PipelineTaskScalarWhereInput[]
  }

  export type PipelineCreateNestedOneWithoutTasksInput = {
    create?: XOR<PipelineCreateWithoutTasksInput, PipelineUncheckedCreateWithoutTasksInput>
    connectOrCreate?: PipelineCreateOrConnectWithoutTasksInput
    connect?: PipelineWhereUniqueInput
  }

  export type EnumTaskStatusFieldUpdateOperationsInput = {
    set?: $Enums.TaskStatus
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type PipelineUpdateOneRequiredWithoutTasksNestedInput = {
    create?: XOR<PipelineCreateWithoutTasksInput, PipelineUncheckedCreateWithoutTasksInput>
    connectOrCreate?: PipelineCreateOrConnectWithoutTasksInput
    upsert?: PipelineUpsertWithoutTasksInput
    connect?: PipelineWhereUniqueInput
    update?: XOR<XOR<PipelineUpdateToOneWithWhereWithoutTasksInput, PipelineUpdateWithoutTasksInput>, PipelineUncheckedUpdateWithoutTasksInput>
  }

  export type EnumAgentStatusFieldUpdateOperationsInput = {
    set?: $Enums.AgentStatus
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumPipelineStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PipelineStatus | EnumPipelineStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PipelineStatus[]
    notIn?: $Enums.PipelineStatus[]
    not?: NestedEnumPipelineStatusFilter<$PrismaModel> | $Enums.PipelineStatus
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumPipelineStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PipelineStatus | EnumPipelineStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PipelineStatus[]
    notIn?: $Enums.PipelineStatus[]
    not?: NestedEnumPipelineStatusWithAggregatesFilter<$PrismaModel> | $Enums.PipelineStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPipelineStatusFilter<$PrismaModel>
    _max?: NestedEnumPipelineStatusFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumTaskStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.TaskStatus | EnumTaskStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TaskStatus[]
    notIn?: $Enums.TaskStatus[]
    not?: NestedEnumTaskStatusFilter<$PrismaModel> | $Enums.TaskStatus
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedEnumTaskStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TaskStatus | EnumTaskStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TaskStatus[]
    notIn?: $Enums.TaskStatus[]
    not?: NestedEnumTaskStatusWithAggregatesFilter<$PrismaModel> | $Enums.TaskStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTaskStatusFilter<$PrismaModel>
    _max?: NestedEnumTaskStatusFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedEnumAgentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.AgentStatus | EnumAgentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AgentStatus[]
    notIn?: $Enums.AgentStatus[]
    not?: NestedEnumAgentStatusFilter<$PrismaModel> | $Enums.AgentStatus
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumAgentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AgentStatus | EnumAgentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AgentStatus[]
    notIn?: $Enums.AgentStatus[]
    not?: NestedEnumAgentStatusWithAggregatesFilter<$PrismaModel> | $Enums.AgentStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAgentStatusFilter<$PrismaModel>
    _max?: NestedEnumAgentStatusFilter<$PrismaModel>
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type PipelineTaskCreateWithoutPipelineInput = {
    id?: string
    name: string
    owner: string
    status?: $Enums.TaskStatus
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    stepOrder?: number
  }

  export type PipelineTaskUncheckedCreateWithoutPipelineInput = {
    id?: string
    name: string
    owner: string
    status?: $Enums.TaskStatus
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    stepOrder?: number
  }

  export type PipelineTaskCreateOrConnectWithoutPipelineInput = {
    where: PipelineTaskWhereUniqueInput
    create: XOR<PipelineTaskCreateWithoutPipelineInput, PipelineTaskUncheckedCreateWithoutPipelineInput>
  }

  export type PipelineTaskCreateManyPipelineInputEnvelope = {
    data: PipelineTaskCreateManyPipelineInput | PipelineTaskCreateManyPipelineInput[]
  }

  export type PipelineTaskUpsertWithWhereUniqueWithoutPipelineInput = {
    where: PipelineTaskWhereUniqueInput
    update: XOR<PipelineTaskUpdateWithoutPipelineInput, PipelineTaskUncheckedUpdateWithoutPipelineInput>
    create: XOR<PipelineTaskCreateWithoutPipelineInput, PipelineTaskUncheckedCreateWithoutPipelineInput>
  }

  export type PipelineTaskUpdateWithWhereUniqueWithoutPipelineInput = {
    where: PipelineTaskWhereUniqueInput
    data: XOR<PipelineTaskUpdateWithoutPipelineInput, PipelineTaskUncheckedUpdateWithoutPipelineInput>
  }

  export type PipelineTaskUpdateManyWithWhereWithoutPipelineInput = {
    where: PipelineTaskScalarWhereInput
    data: XOR<PipelineTaskUpdateManyMutationInput, PipelineTaskUncheckedUpdateManyWithoutPipelineInput>
  }

  export type PipelineTaskScalarWhereInput = {
    AND?: PipelineTaskScalarWhereInput | PipelineTaskScalarWhereInput[]
    OR?: PipelineTaskScalarWhereInput[]
    NOT?: PipelineTaskScalarWhereInput | PipelineTaskScalarWhereInput[]
    id?: StringFilter<"PipelineTask"> | string
    pipelineId?: StringFilter<"PipelineTask"> | string
    name?: StringFilter<"PipelineTask"> | string
    owner?: StringFilter<"PipelineTask"> | string
    status?: EnumTaskStatusFilter<"PipelineTask"> | $Enums.TaskStatus
    startedAt?: DateTimeNullableFilter<"PipelineTask"> | Date | string | null
    completedAt?: DateTimeNullableFilter<"PipelineTask"> | Date | string | null
    stepOrder?: IntFilter<"PipelineTask"> | number
  }

  export type PipelineCreateWithoutTasksInput = {
    id?: string
    orgId: string
    name: string
    description?: string | null
    owner: string
    status?: $Enums.PipelineStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PipelineUncheckedCreateWithoutTasksInput = {
    id?: string
    orgId: string
    name: string
    description?: string | null
    owner: string
    status?: $Enums.PipelineStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PipelineCreateOrConnectWithoutTasksInput = {
    where: PipelineWhereUniqueInput
    create: XOR<PipelineCreateWithoutTasksInput, PipelineUncheckedCreateWithoutTasksInput>
  }

  export type PipelineUpsertWithoutTasksInput = {
    update: XOR<PipelineUpdateWithoutTasksInput, PipelineUncheckedUpdateWithoutTasksInput>
    create: XOR<PipelineCreateWithoutTasksInput, PipelineUncheckedCreateWithoutTasksInput>
    where?: PipelineWhereInput
  }

  export type PipelineUpdateToOneWithWhereWithoutTasksInput = {
    where?: PipelineWhereInput
    data: XOR<PipelineUpdateWithoutTasksInput, PipelineUncheckedUpdateWithoutTasksInput>
  }

  export type PipelineUpdateWithoutTasksInput = {
    id?: StringFieldUpdateOperationsInput | string
    orgId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    owner?: StringFieldUpdateOperationsInput | string
    status?: EnumPipelineStatusFieldUpdateOperationsInput | $Enums.PipelineStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PipelineUncheckedUpdateWithoutTasksInput = {
    id?: StringFieldUpdateOperationsInput | string
    orgId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    owner?: StringFieldUpdateOperationsInput | string
    status?: EnumPipelineStatusFieldUpdateOperationsInput | $Enums.PipelineStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PipelineTaskCreateManyPipelineInput = {
    id?: string
    name: string
    owner: string
    status?: $Enums.TaskStatus
    startedAt?: Date | string | null
    completedAt?: Date | string | null
    stepOrder?: number
  }

  export type PipelineTaskUpdateWithoutPipelineInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    owner?: StringFieldUpdateOperationsInput | string
    status?: EnumTaskStatusFieldUpdateOperationsInput | $Enums.TaskStatus
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stepOrder?: IntFieldUpdateOperationsInput | number
  }

  export type PipelineTaskUncheckedUpdateWithoutPipelineInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    owner?: StringFieldUpdateOperationsInput | string
    status?: EnumTaskStatusFieldUpdateOperationsInput | $Enums.TaskStatus
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stepOrder?: IntFieldUpdateOperationsInput | number
  }

  export type PipelineTaskUncheckedUpdateManyWithoutPipelineInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    owner?: StringFieldUpdateOperationsInput | string
    status?: EnumTaskStatusFieldUpdateOperationsInput | $Enums.TaskStatus
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stepOrder?: IntFieldUpdateOperationsInput | number
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}
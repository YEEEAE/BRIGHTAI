
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model QCRecord
 * 
 */
export type QCRecord = $Result.DefaultSelection<Prisma.$QCRecordPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more QCRecords
 * const qCRecords = await prisma.qCRecord.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
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
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more QCRecords
   * const qCRecords = await prisma.qCRecord.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
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
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.qCRecord`: Exposes CRUD operations for the **QCRecord** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more QCRecords
    * const qCRecords = await prisma.qCRecord.findMany()
    * ```
    */
  get qCRecord(): Prisma.QCRecordDelegate<ExtArgs, ClientOptions>;
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
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.4.2
   * Query Engine version: 94a226be1cf2967af2541cca5529f0f7ba866919
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
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
    QCRecord: 'QCRecord'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "qCRecord"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      QCRecord: {
        payload: Prisma.$QCRecordPayload<ExtArgs>
        fields: Prisma.QCRecordFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QCRecordFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QCRecordPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QCRecordFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QCRecordPayload>
          }
          findFirst: {
            args: Prisma.QCRecordFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QCRecordPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QCRecordFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QCRecordPayload>
          }
          findMany: {
            args: Prisma.QCRecordFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QCRecordPayload>[]
          }
          create: {
            args: Prisma.QCRecordCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QCRecordPayload>
          }
          createMany: {
            args: Prisma.QCRecordCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QCRecordCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QCRecordPayload>[]
          }
          delete: {
            args: Prisma.QCRecordDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QCRecordPayload>
          }
          update: {
            args: Prisma.QCRecordUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QCRecordPayload>
          }
          deleteMany: {
            args: Prisma.QCRecordDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QCRecordUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.QCRecordUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QCRecordPayload>[]
          }
          upsert: {
            args: Prisma.QCRecordUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QCRecordPayload>
          }
          aggregate: {
            args: Prisma.QCRecordAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQCRecord>
          }
          groupBy: {
            args: Prisma.QCRecordGroupByArgs<ExtArgs>
            result: $Utils.Optional<QCRecordGroupByOutputType>[]
          }
          count: {
            args: Prisma.QCRecordCountArgs<ExtArgs>
            result: $Utils.Optional<QCRecordCountAggregateOutputType> | number
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
     * Read more in our [docs](https://pris.ly/d/logging).
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
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
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
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    qCRecord?: QCRecordOmit
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
   * Models
   */

  /**
   * Model QCRecord
   */

  export type AggregateQCRecord = {
    _count: QCRecordCountAggregateOutputType | null
    _avg: QCRecordAvgAggregateOutputType | null
    _sum: QCRecordSumAggregateOutputType | null
    _min: QCRecordMinAggregateOutputType | null
    _max: QCRecordMaxAggregateOutputType | null
  }

  export type QCRecordAvgAggregateOutputType = {
    id: number | null
    producedQty: number | null
    rejectedQty: number | null
    rejectPct: number | null
  }

  export type QCRecordSumAggregateOutputType = {
    id: number | null
    producedQty: number | null
    rejectedQty: number | null
    rejectPct: number | null
  }

  export type QCRecordMinAggregateOutputType = {
    id: number | null
    date: Date | null
    dateStr: string | null
    docNo: string | null
    machineName: string | null
    itemCode: string | null
    itemName: string | null
    producedQty: number | null
    rejectedQty: number | null
    rejectPct: number | null
    rmType: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type QCRecordMaxAggregateOutputType = {
    id: number | null
    date: Date | null
    dateStr: string | null
    docNo: string | null
    machineName: string | null
    itemCode: string | null
    itemName: string | null
    producedQty: number | null
    rejectedQty: number | null
    rejectPct: number | null
    rmType: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type QCRecordCountAggregateOutputType = {
    id: number
    date: number
    dateStr: number
    docNo: number
    machineName: number
    itemCode: number
    itemName: number
    producedQty: number
    rejectedQty: number
    rejectPct: number
    rmType: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type QCRecordAvgAggregateInputType = {
    id?: true
    producedQty?: true
    rejectedQty?: true
    rejectPct?: true
  }

  export type QCRecordSumAggregateInputType = {
    id?: true
    producedQty?: true
    rejectedQty?: true
    rejectPct?: true
  }

  export type QCRecordMinAggregateInputType = {
    id?: true
    date?: true
    dateStr?: true
    docNo?: true
    machineName?: true
    itemCode?: true
    itemName?: true
    producedQty?: true
    rejectedQty?: true
    rejectPct?: true
    rmType?: true
    createdAt?: true
    updatedAt?: true
  }

  export type QCRecordMaxAggregateInputType = {
    id?: true
    date?: true
    dateStr?: true
    docNo?: true
    machineName?: true
    itemCode?: true
    itemName?: true
    producedQty?: true
    rejectedQty?: true
    rejectPct?: true
    rmType?: true
    createdAt?: true
    updatedAt?: true
  }

  export type QCRecordCountAggregateInputType = {
    id?: true
    date?: true
    dateStr?: true
    docNo?: true
    machineName?: true
    itemCode?: true
    itemName?: true
    producedQty?: true
    rejectedQty?: true
    rejectPct?: true
    rmType?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type QCRecordAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QCRecord to aggregate.
     */
    where?: QCRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QCRecords to fetch.
     */
    orderBy?: QCRecordOrderByWithRelationInput | QCRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QCRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QCRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QCRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned QCRecords
    **/
    _count?: true | QCRecordCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: QCRecordAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: QCRecordSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QCRecordMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QCRecordMaxAggregateInputType
  }

  export type GetQCRecordAggregateType<T extends QCRecordAggregateArgs> = {
        [P in keyof T & keyof AggregateQCRecord]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQCRecord[P]>
      : GetScalarType<T[P], AggregateQCRecord[P]>
  }




  export type QCRecordGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QCRecordWhereInput
    orderBy?: QCRecordOrderByWithAggregationInput | QCRecordOrderByWithAggregationInput[]
    by: QCRecordScalarFieldEnum[] | QCRecordScalarFieldEnum
    having?: QCRecordScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QCRecordCountAggregateInputType | true
    _avg?: QCRecordAvgAggregateInputType
    _sum?: QCRecordSumAggregateInputType
    _min?: QCRecordMinAggregateInputType
    _max?: QCRecordMaxAggregateInputType
  }

  export type QCRecordGroupByOutputType = {
    id: number
    date: Date
    dateStr: string
    docNo: string
    machineName: string
    itemCode: string
    itemName: string
    producedQty: number
    rejectedQty: number
    rejectPct: number
    rmType: string
    createdAt: Date
    updatedAt: Date
    _count: QCRecordCountAggregateOutputType | null
    _avg: QCRecordAvgAggregateOutputType | null
    _sum: QCRecordSumAggregateOutputType | null
    _min: QCRecordMinAggregateOutputType | null
    _max: QCRecordMaxAggregateOutputType | null
  }

  type GetQCRecordGroupByPayload<T extends QCRecordGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QCRecordGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QCRecordGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QCRecordGroupByOutputType[P]>
            : GetScalarType<T[P], QCRecordGroupByOutputType[P]>
        }
      >
    >


  export type QCRecordSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    date?: boolean
    dateStr?: boolean
    docNo?: boolean
    machineName?: boolean
    itemCode?: boolean
    itemName?: boolean
    producedQty?: boolean
    rejectedQty?: boolean
    rejectPct?: boolean
    rmType?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["qCRecord"]>

  export type QCRecordSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    date?: boolean
    dateStr?: boolean
    docNo?: boolean
    machineName?: boolean
    itemCode?: boolean
    itemName?: boolean
    producedQty?: boolean
    rejectedQty?: boolean
    rejectPct?: boolean
    rmType?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["qCRecord"]>

  export type QCRecordSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    date?: boolean
    dateStr?: boolean
    docNo?: boolean
    machineName?: boolean
    itemCode?: boolean
    itemName?: boolean
    producedQty?: boolean
    rejectedQty?: boolean
    rejectPct?: boolean
    rmType?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["qCRecord"]>

  export type QCRecordSelectScalar = {
    id?: boolean
    date?: boolean
    dateStr?: boolean
    docNo?: boolean
    machineName?: boolean
    itemCode?: boolean
    itemName?: boolean
    producedQty?: boolean
    rejectedQty?: boolean
    rejectPct?: boolean
    rmType?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type QCRecordOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "date" | "dateStr" | "docNo" | "machineName" | "itemCode" | "itemName" | "producedQty" | "rejectedQty" | "rejectPct" | "rmType" | "createdAt" | "updatedAt", ExtArgs["result"]["qCRecord"]>

  export type $QCRecordPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "QCRecord"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      date: Date
      dateStr: string
      docNo: string
      machineName: string
      itemCode: string
      itemName: string
      producedQty: number
      rejectedQty: number
      rejectPct: number
      rmType: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["qCRecord"]>
    composites: {}
  }

  type QCRecordGetPayload<S extends boolean | null | undefined | QCRecordDefaultArgs> = $Result.GetResult<Prisma.$QCRecordPayload, S>

  type QCRecordCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<QCRecordFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: QCRecordCountAggregateInputType | true
    }

  export interface QCRecordDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['QCRecord'], meta: { name: 'QCRecord' } }
    /**
     * Find zero or one QCRecord that matches the filter.
     * @param {QCRecordFindUniqueArgs} args - Arguments to find a QCRecord
     * @example
     * // Get one QCRecord
     * const qCRecord = await prisma.qCRecord.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QCRecordFindUniqueArgs>(args: SelectSubset<T, QCRecordFindUniqueArgs<ExtArgs>>): Prisma__QCRecordClient<$Result.GetResult<Prisma.$QCRecordPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one QCRecord that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {QCRecordFindUniqueOrThrowArgs} args - Arguments to find a QCRecord
     * @example
     * // Get one QCRecord
     * const qCRecord = await prisma.qCRecord.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QCRecordFindUniqueOrThrowArgs>(args: SelectSubset<T, QCRecordFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QCRecordClient<$Result.GetResult<Prisma.$QCRecordPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first QCRecord that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QCRecordFindFirstArgs} args - Arguments to find a QCRecord
     * @example
     * // Get one QCRecord
     * const qCRecord = await prisma.qCRecord.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QCRecordFindFirstArgs>(args?: SelectSubset<T, QCRecordFindFirstArgs<ExtArgs>>): Prisma__QCRecordClient<$Result.GetResult<Prisma.$QCRecordPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first QCRecord that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QCRecordFindFirstOrThrowArgs} args - Arguments to find a QCRecord
     * @example
     * // Get one QCRecord
     * const qCRecord = await prisma.qCRecord.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QCRecordFindFirstOrThrowArgs>(args?: SelectSubset<T, QCRecordFindFirstOrThrowArgs<ExtArgs>>): Prisma__QCRecordClient<$Result.GetResult<Prisma.$QCRecordPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more QCRecords that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QCRecordFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all QCRecords
     * const qCRecords = await prisma.qCRecord.findMany()
     * 
     * // Get first 10 QCRecords
     * const qCRecords = await prisma.qCRecord.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const qCRecordWithIdOnly = await prisma.qCRecord.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QCRecordFindManyArgs>(args?: SelectSubset<T, QCRecordFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QCRecordPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a QCRecord.
     * @param {QCRecordCreateArgs} args - Arguments to create a QCRecord.
     * @example
     * // Create one QCRecord
     * const QCRecord = await prisma.qCRecord.create({
     *   data: {
     *     // ... data to create a QCRecord
     *   }
     * })
     * 
     */
    create<T extends QCRecordCreateArgs>(args: SelectSubset<T, QCRecordCreateArgs<ExtArgs>>): Prisma__QCRecordClient<$Result.GetResult<Prisma.$QCRecordPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many QCRecords.
     * @param {QCRecordCreateManyArgs} args - Arguments to create many QCRecords.
     * @example
     * // Create many QCRecords
     * const qCRecord = await prisma.qCRecord.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QCRecordCreateManyArgs>(args?: SelectSubset<T, QCRecordCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many QCRecords and returns the data saved in the database.
     * @param {QCRecordCreateManyAndReturnArgs} args - Arguments to create many QCRecords.
     * @example
     * // Create many QCRecords
     * const qCRecord = await prisma.qCRecord.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many QCRecords and only return the `id`
     * const qCRecordWithIdOnly = await prisma.qCRecord.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QCRecordCreateManyAndReturnArgs>(args?: SelectSubset<T, QCRecordCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QCRecordPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a QCRecord.
     * @param {QCRecordDeleteArgs} args - Arguments to delete one QCRecord.
     * @example
     * // Delete one QCRecord
     * const QCRecord = await prisma.qCRecord.delete({
     *   where: {
     *     // ... filter to delete one QCRecord
     *   }
     * })
     * 
     */
    delete<T extends QCRecordDeleteArgs>(args: SelectSubset<T, QCRecordDeleteArgs<ExtArgs>>): Prisma__QCRecordClient<$Result.GetResult<Prisma.$QCRecordPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one QCRecord.
     * @param {QCRecordUpdateArgs} args - Arguments to update one QCRecord.
     * @example
     * // Update one QCRecord
     * const qCRecord = await prisma.qCRecord.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QCRecordUpdateArgs>(args: SelectSubset<T, QCRecordUpdateArgs<ExtArgs>>): Prisma__QCRecordClient<$Result.GetResult<Prisma.$QCRecordPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more QCRecords.
     * @param {QCRecordDeleteManyArgs} args - Arguments to filter QCRecords to delete.
     * @example
     * // Delete a few QCRecords
     * const { count } = await prisma.qCRecord.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QCRecordDeleteManyArgs>(args?: SelectSubset<T, QCRecordDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QCRecords.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QCRecordUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many QCRecords
     * const qCRecord = await prisma.qCRecord.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QCRecordUpdateManyArgs>(args: SelectSubset<T, QCRecordUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QCRecords and returns the data updated in the database.
     * @param {QCRecordUpdateManyAndReturnArgs} args - Arguments to update many QCRecords.
     * @example
     * // Update many QCRecords
     * const qCRecord = await prisma.qCRecord.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more QCRecords and only return the `id`
     * const qCRecordWithIdOnly = await prisma.qCRecord.updateManyAndReturn({
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
    updateManyAndReturn<T extends QCRecordUpdateManyAndReturnArgs>(args: SelectSubset<T, QCRecordUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QCRecordPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one QCRecord.
     * @param {QCRecordUpsertArgs} args - Arguments to update or create a QCRecord.
     * @example
     * // Update or create a QCRecord
     * const qCRecord = await prisma.qCRecord.upsert({
     *   create: {
     *     // ... data to create a QCRecord
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the QCRecord we want to update
     *   }
     * })
     */
    upsert<T extends QCRecordUpsertArgs>(args: SelectSubset<T, QCRecordUpsertArgs<ExtArgs>>): Prisma__QCRecordClient<$Result.GetResult<Prisma.$QCRecordPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of QCRecords.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QCRecordCountArgs} args - Arguments to filter QCRecords to count.
     * @example
     * // Count the number of QCRecords
     * const count = await prisma.qCRecord.count({
     *   where: {
     *     // ... the filter for the QCRecords we want to count
     *   }
     * })
    **/
    count<T extends QCRecordCountArgs>(
      args?: Subset<T, QCRecordCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QCRecordCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a QCRecord.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QCRecordAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends QCRecordAggregateArgs>(args: Subset<T, QCRecordAggregateArgs>): Prisma.PrismaPromise<GetQCRecordAggregateType<T>>

    /**
     * Group by QCRecord.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QCRecordGroupByArgs} args - Group by arguments.
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
      T extends QCRecordGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QCRecordGroupByArgs['orderBy'] }
        : { orderBy?: QCRecordGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, QCRecordGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQCRecordGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the QCRecord model
   */
  readonly fields: QCRecordFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for QCRecord.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QCRecordClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the QCRecord model
   */
  interface QCRecordFieldRefs {
    readonly id: FieldRef<"QCRecord", 'Int'>
    readonly date: FieldRef<"QCRecord", 'DateTime'>
    readonly dateStr: FieldRef<"QCRecord", 'String'>
    readonly docNo: FieldRef<"QCRecord", 'String'>
    readonly machineName: FieldRef<"QCRecord", 'String'>
    readonly itemCode: FieldRef<"QCRecord", 'String'>
    readonly itemName: FieldRef<"QCRecord", 'String'>
    readonly producedQty: FieldRef<"QCRecord", 'Float'>
    readonly rejectedQty: FieldRef<"QCRecord", 'Float'>
    readonly rejectPct: FieldRef<"QCRecord", 'Float'>
    readonly rmType: FieldRef<"QCRecord", 'String'>
    readonly createdAt: FieldRef<"QCRecord", 'DateTime'>
    readonly updatedAt: FieldRef<"QCRecord", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * QCRecord findUnique
   */
  export type QCRecordFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QCRecord
     */
    select?: QCRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QCRecord
     */
    omit?: QCRecordOmit<ExtArgs> | null
    /**
     * Filter, which QCRecord to fetch.
     */
    where: QCRecordWhereUniqueInput
  }

  /**
   * QCRecord findUniqueOrThrow
   */
  export type QCRecordFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QCRecord
     */
    select?: QCRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QCRecord
     */
    omit?: QCRecordOmit<ExtArgs> | null
    /**
     * Filter, which QCRecord to fetch.
     */
    where: QCRecordWhereUniqueInput
  }

  /**
   * QCRecord findFirst
   */
  export type QCRecordFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QCRecord
     */
    select?: QCRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QCRecord
     */
    omit?: QCRecordOmit<ExtArgs> | null
    /**
     * Filter, which QCRecord to fetch.
     */
    where?: QCRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QCRecords to fetch.
     */
    orderBy?: QCRecordOrderByWithRelationInput | QCRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QCRecords.
     */
    cursor?: QCRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QCRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QCRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QCRecords.
     */
    distinct?: QCRecordScalarFieldEnum | QCRecordScalarFieldEnum[]
  }

  /**
   * QCRecord findFirstOrThrow
   */
  export type QCRecordFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QCRecord
     */
    select?: QCRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QCRecord
     */
    omit?: QCRecordOmit<ExtArgs> | null
    /**
     * Filter, which QCRecord to fetch.
     */
    where?: QCRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QCRecords to fetch.
     */
    orderBy?: QCRecordOrderByWithRelationInput | QCRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QCRecords.
     */
    cursor?: QCRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QCRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QCRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QCRecords.
     */
    distinct?: QCRecordScalarFieldEnum | QCRecordScalarFieldEnum[]
  }

  /**
   * QCRecord findMany
   */
  export type QCRecordFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QCRecord
     */
    select?: QCRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QCRecord
     */
    omit?: QCRecordOmit<ExtArgs> | null
    /**
     * Filter, which QCRecords to fetch.
     */
    where?: QCRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QCRecords to fetch.
     */
    orderBy?: QCRecordOrderByWithRelationInput | QCRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing QCRecords.
     */
    cursor?: QCRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QCRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QCRecords.
     */
    skip?: number
    distinct?: QCRecordScalarFieldEnum | QCRecordScalarFieldEnum[]
  }

  /**
   * QCRecord create
   */
  export type QCRecordCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QCRecord
     */
    select?: QCRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QCRecord
     */
    omit?: QCRecordOmit<ExtArgs> | null
    /**
     * The data needed to create a QCRecord.
     */
    data: XOR<QCRecordCreateInput, QCRecordUncheckedCreateInput>
  }

  /**
   * QCRecord createMany
   */
  export type QCRecordCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many QCRecords.
     */
    data: QCRecordCreateManyInput | QCRecordCreateManyInput[]
  }

  /**
   * QCRecord createManyAndReturn
   */
  export type QCRecordCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QCRecord
     */
    select?: QCRecordSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the QCRecord
     */
    omit?: QCRecordOmit<ExtArgs> | null
    /**
     * The data used to create many QCRecords.
     */
    data: QCRecordCreateManyInput | QCRecordCreateManyInput[]
  }

  /**
   * QCRecord update
   */
  export type QCRecordUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QCRecord
     */
    select?: QCRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QCRecord
     */
    omit?: QCRecordOmit<ExtArgs> | null
    /**
     * The data needed to update a QCRecord.
     */
    data: XOR<QCRecordUpdateInput, QCRecordUncheckedUpdateInput>
    /**
     * Choose, which QCRecord to update.
     */
    where: QCRecordWhereUniqueInput
  }

  /**
   * QCRecord updateMany
   */
  export type QCRecordUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update QCRecords.
     */
    data: XOR<QCRecordUpdateManyMutationInput, QCRecordUncheckedUpdateManyInput>
    /**
     * Filter which QCRecords to update
     */
    where?: QCRecordWhereInput
    /**
     * Limit how many QCRecords to update.
     */
    limit?: number
  }

  /**
   * QCRecord updateManyAndReturn
   */
  export type QCRecordUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QCRecord
     */
    select?: QCRecordSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the QCRecord
     */
    omit?: QCRecordOmit<ExtArgs> | null
    /**
     * The data used to update QCRecords.
     */
    data: XOR<QCRecordUpdateManyMutationInput, QCRecordUncheckedUpdateManyInput>
    /**
     * Filter which QCRecords to update
     */
    where?: QCRecordWhereInput
    /**
     * Limit how many QCRecords to update.
     */
    limit?: number
  }

  /**
   * QCRecord upsert
   */
  export type QCRecordUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QCRecord
     */
    select?: QCRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QCRecord
     */
    omit?: QCRecordOmit<ExtArgs> | null
    /**
     * The filter to search for the QCRecord to update in case it exists.
     */
    where: QCRecordWhereUniqueInput
    /**
     * In case the QCRecord found by the `where` argument doesn't exist, create a new QCRecord with this data.
     */
    create: XOR<QCRecordCreateInput, QCRecordUncheckedCreateInput>
    /**
     * In case the QCRecord was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QCRecordUpdateInput, QCRecordUncheckedUpdateInput>
  }

  /**
   * QCRecord delete
   */
  export type QCRecordDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QCRecord
     */
    select?: QCRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QCRecord
     */
    omit?: QCRecordOmit<ExtArgs> | null
    /**
     * Filter which QCRecord to delete.
     */
    where: QCRecordWhereUniqueInput
  }

  /**
   * QCRecord deleteMany
   */
  export type QCRecordDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QCRecords to delete
     */
    where?: QCRecordWhereInput
    /**
     * Limit how many QCRecords to delete.
     */
    limit?: number
  }

  /**
   * QCRecord without action
   */
  export type QCRecordDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QCRecord
     */
    select?: QCRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QCRecord
     */
    omit?: QCRecordOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const QCRecordScalarFieldEnum: {
    id: 'id',
    date: 'date',
    dateStr: 'dateStr',
    docNo: 'docNo',
    machineName: 'machineName',
    itemCode: 'itemCode',
    itemName: 'itemName',
    producedQty: 'producedQty',
    rejectedQty: 'rejectedQty',
    rejectPct: 'rejectPct',
    rmType: 'rmType',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type QCRecordScalarFieldEnum = (typeof QCRecordScalarFieldEnum)[keyof typeof QCRecordScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type QCRecordWhereInput = {
    AND?: QCRecordWhereInput | QCRecordWhereInput[]
    OR?: QCRecordWhereInput[]
    NOT?: QCRecordWhereInput | QCRecordWhereInput[]
    id?: IntFilter<"QCRecord"> | number
    date?: DateTimeFilter<"QCRecord"> | Date | string
    dateStr?: StringFilter<"QCRecord"> | string
    docNo?: StringFilter<"QCRecord"> | string
    machineName?: StringFilter<"QCRecord"> | string
    itemCode?: StringFilter<"QCRecord"> | string
    itemName?: StringFilter<"QCRecord"> | string
    producedQty?: FloatFilter<"QCRecord"> | number
    rejectedQty?: FloatFilter<"QCRecord"> | number
    rejectPct?: FloatFilter<"QCRecord"> | number
    rmType?: StringFilter<"QCRecord"> | string
    createdAt?: DateTimeFilter<"QCRecord"> | Date | string
    updatedAt?: DateTimeFilter<"QCRecord"> | Date | string
  }

  export type QCRecordOrderByWithRelationInput = {
    id?: SortOrder
    date?: SortOrder
    dateStr?: SortOrder
    docNo?: SortOrder
    machineName?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    producedQty?: SortOrder
    rejectedQty?: SortOrder
    rejectPct?: SortOrder
    rmType?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QCRecordWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: QCRecordWhereInput | QCRecordWhereInput[]
    OR?: QCRecordWhereInput[]
    NOT?: QCRecordWhereInput | QCRecordWhereInput[]
    date?: DateTimeFilter<"QCRecord"> | Date | string
    dateStr?: StringFilter<"QCRecord"> | string
    docNo?: StringFilter<"QCRecord"> | string
    machineName?: StringFilter<"QCRecord"> | string
    itemCode?: StringFilter<"QCRecord"> | string
    itemName?: StringFilter<"QCRecord"> | string
    producedQty?: FloatFilter<"QCRecord"> | number
    rejectedQty?: FloatFilter<"QCRecord"> | number
    rejectPct?: FloatFilter<"QCRecord"> | number
    rmType?: StringFilter<"QCRecord"> | string
    createdAt?: DateTimeFilter<"QCRecord"> | Date | string
    updatedAt?: DateTimeFilter<"QCRecord"> | Date | string
  }, "id">

  export type QCRecordOrderByWithAggregationInput = {
    id?: SortOrder
    date?: SortOrder
    dateStr?: SortOrder
    docNo?: SortOrder
    machineName?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    producedQty?: SortOrder
    rejectedQty?: SortOrder
    rejectPct?: SortOrder
    rmType?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: QCRecordCountOrderByAggregateInput
    _avg?: QCRecordAvgOrderByAggregateInput
    _max?: QCRecordMaxOrderByAggregateInput
    _min?: QCRecordMinOrderByAggregateInput
    _sum?: QCRecordSumOrderByAggregateInput
  }

  export type QCRecordScalarWhereWithAggregatesInput = {
    AND?: QCRecordScalarWhereWithAggregatesInput | QCRecordScalarWhereWithAggregatesInput[]
    OR?: QCRecordScalarWhereWithAggregatesInput[]
    NOT?: QCRecordScalarWhereWithAggregatesInput | QCRecordScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"QCRecord"> | number
    date?: DateTimeWithAggregatesFilter<"QCRecord"> | Date | string
    dateStr?: StringWithAggregatesFilter<"QCRecord"> | string
    docNo?: StringWithAggregatesFilter<"QCRecord"> | string
    machineName?: StringWithAggregatesFilter<"QCRecord"> | string
    itemCode?: StringWithAggregatesFilter<"QCRecord"> | string
    itemName?: StringWithAggregatesFilter<"QCRecord"> | string
    producedQty?: FloatWithAggregatesFilter<"QCRecord"> | number
    rejectedQty?: FloatWithAggregatesFilter<"QCRecord"> | number
    rejectPct?: FloatWithAggregatesFilter<"QCRecord"> | number
    rmType?: StringWithAggregatesFilter<"QCRecord"> | string
    createdAt?: DateTimeWithAggregatesFilter<"QCRecord"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"QCRecord"> | Date | string
  }

  export type QCRecordCreateInput = {
    date: Date | string
    dateStr: string
    docNo: string
    machineName: string
    itemCode: string
    itemName: string
    producedQty: number
    rejectedQty: number
    rejectPct: number
    rmType: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QCRecordUncheckedCreateInput = {
    id?: number
    date: Date | string
    dateStr: string
    docNo: string
    machineName: string
    itemCode: string
    itemName: string
    producedQty: number
    rejectedQty: number
    rejectPct: number
    rmType: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QCRecordUpdateInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    dateStr?: StringFieldUpdateOperationsInput | string
    docNo?: StringFieldUpdateOperationsInput | string
    machineName?: StringFieldUpdateOperationsInput | string
    itemCode?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    producedQty?: FloatFieldUpdateOperationsInput | number
    rejectedQty?: FloatFieldUpdateOperationsInput | number
    rejectPct?: FloatFieldUpdateOperationsInput | number
    rmType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QCRecordUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    dateStr?: StringFieldUpdateOperationsInput | string
    docNo?: StringFieldUpdateOperationsInput | string
    machineName?: StringFieldUpdateOperationsInput | string
    itemCode?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    producedQty?: FloatFieldUpdateOperationsInput | number
    rejectedQty?: FloatFieldUpdateOperationsInput | number
    rejectPct?: FloatFieldUpdateOperationsInput | number
    rmType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QCRecordCreateManyInput = {
    id?: number
    date: Date | string
    dateStr: string
    docNo: string
    machineName: string
    itemCode: string
    itemName: string
    producedQty: number
    rejectedQty: number
    rejectPct: number
    rmType: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QCRecordUpdateManyMutationInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    dateStr?: StringFieldUpdateOperationsInput | string
    docNo?: StringFieldUpdateOperationsInput | string
    machineName?: StringFieldUpdateOperationsInput | string
    itemCode?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    producedQty?: FloatFieldUpdateOperationsInput | number
    rejectedQty?: FloatFieldUpdateOperationsInput | number
    rejectPct?: FloatFieldUpdateOperationsInput | number
    rmType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QCRecordUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    dateStr?: StringFieldUpdateOperationsInput | string
    docNo?: StringFieldUpdateOperationsInput | string
    machineName?: StringFieldUpdateOperationsInput | string
    itemCode?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    producedQty?: FloatFieldUpdateOperationsInput | number
    rejectedQty?: FloatFieldUpdateOperationsInput | number
    rejectPct?: FloatFieldUpdateOperationsInput | number
    rmType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
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

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type QCRecordCountOrderByAggregateInput = {
    id?: SortOrder
    date?: SortOrder
    dateStr?: SortOrder
    docNo?: SortOrder
    machineName?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    producedQty?: SortOrder
    rejectedQty?: SortOrder
    rejectPct?: SortOrder
    rmType?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QCRecordAvgOrderByAggregateInput = {
    id?: SortOrder
    producedQty?: SortOrder
    rejectedQty?: SortOrder
    rejectPct?: SortOrder
  }

  export type QCRecordMaxOrderByAggregateInput = {
    id?: SortOrder
    date?: SortOrder
    dateStr?: SortOrder
    docNo?: SortOrder
    machineName?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    producedQty?: SortOrder
    rejectedQty?: SortOrder
    rejectPct?: SortOrder
    rmType?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QCRecordMinOrderByAggregateInput = {
    id?: SortOrder
    date?: SortOrder
    dateStr?: SortOrder
    docNo?: SortOrder
    machineName?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    producedQty?: SortOrder
    rejectedQty?: SortOrder
    rejectPct?: SortOrder
    rmType?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QCRecordSumOrderByAggregateInput = {
    id?: SortOrder
    producedQty?: SortOrder
    rejectedQty?: SortOrder
    rejectPct?: SortOrder
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

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
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

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
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
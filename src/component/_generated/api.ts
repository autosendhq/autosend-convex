/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as cleanup from "../cleanup.js";
import type * as cleanupInternal from "../cleanupInternal.js";
import type * as config from "../config.js";
import type * as contactLists from "../contactLists.js";
import type * as contacts from "../contacts.js";
import type * as emails from "../emails.js";
import type * as projects from "../projects.js";
import type * as provider from "../provider.js";
import type * as queries from "../queries.js";
import type * as queue from "../queue.js";
import type * as queueInternal from "../queueInternal.js";
import type * as types from "../types.js";
import type * as webhooks from "../webhooks.js";
import type * as webhooksInternal from "../webhooksInternal.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import { anyApi, componentsGeneric } from "convex/server";

const fullApi: ApiFromModules<{
  cleanup: typeof cleanup;
  cleanupInternal: typeof cleanupInternal;
  config: typeof config;
  contactLists: typeof contactLists;
  contacts: typeof contacts;
  emails: typeof emails;
  projects: typeof projects;
  provider: typeof provider;
  queries: typeof queries;
  queue: typeof queue;
  queueInternal: typeof queueInternal;
  types: typeof types;
  webhooks: typeof webhooks;
  webhooksInternal: typeof webhooksInternal;
}> = anyApi as any;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
> = anyApi as any;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
> = anyApi as any;

export const components = componentsGeneric() as unknown as {};

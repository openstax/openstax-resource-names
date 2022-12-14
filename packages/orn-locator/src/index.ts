import asyncPool from 'tiny-async-pool';
import { patterns } from './ornPatterns';

export const locate = async (orn: string) => {
  for (const pattern of Object.values(patterns)) {
    const match = pattern.match(orn);

    if (match) {
      return await pattern.resolve(match.params);
    }
  }

  return {type: 'not-found', orn} as const;
};

export const locateAll = async(orn: string[], {concurrency = 2}: {concurrency?: number} = {}) => {
  const results: Awaited<ReturnType<typeof locate>>[] = [];
  
  for await (const result of asyncPool(concurrency, orn, locate)) {
    results.push(result);
  }

  return results;
};

export const search = async(query: string, limit: number = 5, filters: {[key: string]: string | string[]} = {}) => {
  type Patterns = typeof patterns;
  const result: {[K in keyof Patterns]?: {name: string; items: Awaited<ReturnType<NonNullable<Patterns[K]['search']>>>}} = {};

  for (const [key, pattern] of Object.entries(patterns)) {
    const innerResult = await pattern.search?.(query, limit, filters);
    if (innerResult && innerResult.length > 0) {
      result[key as keyof Patterns] = {items: innerResult as any, name: pattern.name};
    }
  }

  return result;
};

export { patterns };

export default {locate, locateAll, patterns, search};


type FilterWithKey<T, K extends string> = T extends {[key in K]: any} ? T : never;

/*
 * this is anything that might be returned by `locate` or `locateAll`
 */
export type AnyOrnLocateResponse = Awaited<ReturnType<typeof locate>>;

/*
 * resources can have `contents` trees that can contain summary versions of the main resource
 * types in `AnyOrnLocateResponse`. `AnyOrnResource` unions all main responses with anything in
 * the contents trees.
 */
export type AnyOrnResource = AnyOrnLocateResponse | FilterWithKey<AnyOrnLocateResponse, 'contents'>['contents'][number];

/*
 * utility for filtering `AnyOrnResource` or `AnyOrnLocateResponse` by type. useful for the return type
 * of guards.
 */
export type FilterOrnTypes<T, K extends AnyOrnResource['type']> = T extends {type: K} ? T : never;

/*
 * guard for one or more type strings
 */
export const isResourceOrContentOfType = <R extends AnyOrnResource, T extends AnyOrnResource['type'][]>(
  resource: R, types: T
): resource is FilterOrnTypes<R, T[number]> =>
  'type' in resource && types.includes(resource.type);


/*
 * when passing guards into `Array.filter` you need to pass just the guard, not the guard wrapped in another function
 * for it to correctly filter the response type, so this is a helper for doing that.
 */
export const isResourceOrContentOfTypeFilter = <T extends AnyOrnResource['type'][], R extends AnyOrnResource = AnyOrnResource>(types: T) =>  (resource: R): resource is FilterOrnTypes<R, T[number]> =>
  'type' in resource && types.includes(resource.type);

/*
 * flattens a resource's contents tree and filters to given types
 */
export const filterResourceContents = <T extends AnyOrnResource['type'][]>(
  resource: AnyOrnResource, types: T
): FilterOrnTypes<AnyOrnResource, T[number]>[] => {
  const content: AnyOrnResource[] = 'contents' in resource ? resource.contents : [];
  const base: FilterOrnTypes<AnyOrnResource, T[number]>[] =
    isResourceOrContentOfType(resource, types) ? [resource] : [];

  return content.reduce((result, child) => {
    return [
      ...result,
      ...filterResourceContents(child, types),
    ];
  }, base);
};

import memoize from 'lodash/fp/memoize';
import * as pathToRegexp from 'path-to-regexp';
import { patterns } from './ornPatterns';

const compileMatcher = memoize((path: string) =>
  pathToRegexp.match<any>(path, {decode: decodeURIComponent})
);

export const locate = async (orn: string) => {

  for (const [path, resolver] of Object.entries(patterns)) {
    const match = compileMatcher(path)(orn);

    if (match) {
      return await resolver(match.params);
    }
  }

  return {type: 'not-found', orn} as const;
};

export const locateAll = (orn: string[]) => {
  return Promise.all(orn.map(locate));
};

export default {locate, locateAll};


type Unpromise<T> = T extends Promise<infer I> ? I : never;
type FilterWithKey<T, K extends string> = T extends {[key in K]: any} ? T : never; 

/*
 * this is anything that might be returned by `locate` or `locateAll`
 */
export type AnyOrnLocateResponse = Unpromise<ReturnType<typeof locate>>;

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

import {locate, locateAll, search} from './lookup';
import type { AnyOrnLocateResponse, SearchResponse } from './resolve';

export { locate, locateAll, search };

export type { AnyOrnLocateResponse, SearchResponse };

export default {locate, locateAll, search};

type FilterWithKey<T, K extends string> = T extends {[key in K]: any} ? T : never;

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
  resource: AnyOrnResource | AnyOrnResource[], types: T
): FilterOrnTypes<AnyOrnResource, T[number]>[] => {
  const content: AnyOrnResource[] = resource instanceof Array ? resource : 'contents' in resource ? resource.contents : [];
  const base: FilterOrnTypes<AnyOrnResource, T[number]>[] =
    !(resource instanceof Array) && isResourceOrContentOfType(resource, types) ? [resource] : [];

  return content.reduce((result, child) => {
    return [
      ...result,
      ...filterResourceContents(child, types),
    ];
  }, base);
};

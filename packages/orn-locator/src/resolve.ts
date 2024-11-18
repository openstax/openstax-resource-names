import asyncPool from 'tiny-async-pool/lib/es6';
import { patterns } from './ornPatterns';
import type { SearchClient } from './types/searchClient';

export type LocateOptions = {
  searchClient: SearchClient;
  skipCache?: boolean;
};

export type LocateAllOptions = LocateOptions & { concurrency?: number };

export const locate = async (options: LocateOptions, orn: string) => {
  const useCache = options.searchClient && !options.skipCache;

  for (const pattern of Object.values(patterns)) {
    const match = pattern.match(orn);

    if (match) {
      if (useCache && pattern.cacheable && pattern.search) {
        const cachedResult = await pattern.search(options.searchClient, orn, 1, 's2');
        if (cachedResult[0]) { return cachedResult[0]; }
      }
      return pattern.resolve(match.params);
    }
  }

  return {type: 'not-found', orn} as const;
};

export const locateAll = async(
  {concurrency = 2, ...options}: LocateAllOptions, orn: string[]
): Promise<AnyOrnLocateResponse[]> => {
  const boundLocate = locate.bind(null, options);
  return await asyncPool(concurrency, orn, boundLocate);
};

type Patterns = typeof patterns;

export const search = async(searchClient: SearchClient, query: string, limit: number = 5, type?: string) => {
  const result: {[K in keyof Patterns]?: {name: string; items: Awaited<ReturnType<NonNullable<Patterns[K]['search']>>>}} = {};

  const searchPattern = async(key: keyof Patterns, pattern: Patterns[keyof Patterns]) => {
    const innerResult = await pattern.search?.(searchClient, query, limit);
    if (innerResult && innerResult.length > 0) {
      result[key as keyof Patterns] = {items: innerResult as any, name: pattern.name};
    }
  };

  if (type) {
    if (type in patterns) {
      const key = type as keyof Patterns;
      await searchPattern(key, patterns[key]);
    }
  } else {
    for (const [key, pattern] of Object.entries(patterns)) {
      if (pattern.excludeFromDefaultSearch) { continue; }
      await searchPattern(key as keyof Patterns, pattern);
    }
  }

  return result;
};

/*
 * this is anything that might be returned by `locate` or `locateAll`
 */
export type AnyOrnLocateResponse = Awaited<ReturnType<typeof locate>>;

export type SearchResponse = Awaited<ReturnType<typeof search>>;

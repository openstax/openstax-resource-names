import asyncPool from 'tiny-async-pool/lib/es6';
import { patterns } from './ornPatterns';
import type { SearchClient } from './types/searchClient';

export const locate = async (orn: string) => {
  for (const pattern of Object.values(patterns)) {
    const match = pattern.match(orn);

    if (match) {
      return await pattern.resolve(match.params);
    }
  }

  return {type: 'not-found', orn} as const;
};

export const locateAll = async(orn: string[], {concurrency = 2}: {concurrency?: number} = {}): Promise<AnyOrnLocateResponse[]> => {
  return await asyncPool(concurrency, orn, locate);
};

export const search = async(searchClient: SearchClient, query: string, limit: number = 5) => {
  type Patterns = typeof patterns;
  const result: {[K in keyof Patterns]?: {name: string; items: Awaited<ReturnType<NonNullable<Patterns[K]['search']>>>}} = {};

  for (const [key, pattern] of Object.entries(patterns)) {
    if (pattern.excludeFromDefaultSearch) { continue; }

    const innerResult = await pattern.search?.(searchClient, query, limit);
    if (innerResult && innerResult.length > 0) {
      result[key as keyof Patterns] = {items: innerResult as any, name: pattern.name};
    }
  }

  return result;
};

/*
 * this is anything that might be returned by `locate` or `locateAll`
 */
export type AnyOrnLocateResponse = Awaited<ReturnType<typeof locate>>;

export type SearchResponse = Awaited<ReturnType<typeof search>>;

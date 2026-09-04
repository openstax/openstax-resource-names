import { stringify } from '@openstax/ts-utils/misc/queryString';
import type { AnyOrnLocateResponse, SearchResponse } from './resolve';
import { acceptResponse } from './utils/acceptResponse';

// process may be undefined in the browser (e.g. Vite doesn't shim it)
const env = (key: string): string | undefined =>
  typeof process !== 'undefined' && process.env ? process.env[key] : undefined;

const locateHost = env('ORN_LOCATE_HOST') || env('REACT_APP_ORN_LOCATE_HOST') || env('VITE_ORN_LOCATE_HOST') || 'https://orn.openstax.org';

export const locate = async (orn: string): Promise<AnyOrnLocateResponse> => {
  return fetch(locateHost + (new URL(orn)).pathname + '.json')
    .then(response => acceptResponse(response))
    .then(response => response.json() as any);
};

export const locateAll = async(orn: string[]): Promise<AnyOrnLocateResponse[]> => {
  if (orn.length === 0) {
    return Promise.resolve([]);
  }
  return fetch(locateHost + '/api/v0/orn-lookup?' + stringify({orn}))
    .then(response => acceptResponse(response))
    .then(response => response.json() as any)
    .then(response => response.items)
  ;
};

export const search = async(query: string, limit: number = 5, filters: {[key: string]: string | string[]} = {}): Promise<SearchResponse> => {
  return fetch(locateHost + '/api/v0/search?' + stringify({query, limit, ...filters}))
    .then(response => acceptResponse(response))
    .then(response => response.json() as any)
  ;
};

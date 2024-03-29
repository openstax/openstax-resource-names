import queryString from 'query-string';
import type { AnyOrnLocateResponse, SearchResponse } from './resolve';
import { acceptResponse } from './utils/acceptResponse';

const locateHost = process.env.ORN_LOCATE_HOST || process.env.REACT_APP_ORN_LOCATE_HOST || 'https://orn.openstax.org';

export const locate = async (orn: string): Promise<AnyOrnLocateResponse> => {
  return fetch(locateHost + (new URL(orn)).pathname + '.json')
    .then(response => acceptResponse(response))
    .then(response => response.json());
};

export const locateAll = async(orn: string[]): Promise<AnyOrnLocateResponse[]> => {
  if (orn.length === 0) {
    return Promise.resolve([]);
  }
  return fetch(locateHost + '/api/v0/orn-lookup?' + queryString.stringify({orn}))
    .then(response => acceptResponse(response))
    .then(response => response.json())
    .then(response => response.items)
  ;
};

export const search = async(query: string, limit: number = 5, filters: {[key: string]: string | string[]} = {}): Promise<SearchResponse> => {
  return fetch(locateHost + '/api/v0/search?' + queryString.stringify({query, limit, ...filters}))
    .then(response => acceptResponse(response))
    .then(response => response.json())
  ;
};

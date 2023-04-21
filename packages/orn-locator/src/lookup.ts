import queryString from 'query-string';
import type { AnyOrnLocateResponse, SearchResponse } from './resolve';

const locateHost = process.env.ORN_LOCATE_HOST || process.env.REACT_APP_ORN_LOCATE_HOST || 'https://orn.openstax.org';

export const locate = async (orn: string): Promise<AnyOrnLocateResponse> => {
  return fetch(locateHost + (new URL(orn)).pathname + '.json')
    .then(response => response.json());
};

export const locateAll = async(orn: string[]): Promise<AnyOrnLocateResponse[]> => {
  return fetch(locateHost + '/api/v0/orn-lookup' + queryString.stringify({orn}))
    .then(response => response.json())
    .then(response => response.items)
  ;
};

export const search = async(query: string, limit: number = 5, filters: {[key: string]: string | string[]} = {}): Promise<SearchResponse> => {
  return fetch(locateHost + '/api/v0/search' + queryString.stringify({query, limit, ...filters}))
    .then(response => response.json())
  ;
};

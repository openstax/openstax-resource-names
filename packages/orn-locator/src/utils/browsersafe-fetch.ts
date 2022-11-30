import { RequestInfo, RequestInit, Response } from 'node-fetch';

declare var window: any | undefined;

type Fetch = (
    url: RequestInfo,
    init?: RequestInit
) => Promise<Response>;

export const fetch: Fetch = async(...args) => {
  const fetchImpl: Fetch = typeof window === 'undefined'
    ? (await import('node-fetch')).default
    : window.fetch
  ;

  return fetchImpl(...args);
};

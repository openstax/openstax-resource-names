import { RequestInfo, RequestInit, Response } from 'node-fetch';

declare var globalThis: any;

type Fetch = (
    url: RequestInfo,
    init?: RequestInit
) => Promise<Response>;

export const fetch: Fetch = async(...args) => {
  const fetchImpl: Fetch = globalThis.fetch; 

  return fetchImpl(...args);
};

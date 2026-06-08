import nodeFetch from 'node-fetch';

declare let globalThis: any;

globalThis.fetch = nodeFetch;

export * from './';

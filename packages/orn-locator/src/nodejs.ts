import nodeFetch from 'node-fetch';

declare var globalThis: any;

globalThis.fetch = nodeFetch;

export * from './';

import { JSDOM } from 'jsdom';
import nodeFetch from 'node-fetch';

declare var globalThis: any;

globalThis.DOMParser = new JSDOM().window.DOMParser;
globalThis.fetch = nodeFetch;

export * from './';

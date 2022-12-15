import { DOMWindow } from 'jsdom';

declare var globalThis: any;

export const getDOMParser = async(): Promise<DOMWindow['DOMParser']> => Promise.resolve(globalThis.DOMParser);

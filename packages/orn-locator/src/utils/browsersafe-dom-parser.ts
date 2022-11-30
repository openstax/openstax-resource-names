import { DOMWindow } from 'jsdom';

declare var window: any | undefined;

export const getDOMParser = async(): Promise<DOMWindow['DOMParser']> => typeof window === 'undefined'
  ? new (await import('jsdom')).JSDOM().window.DOMParser
  : window.DOMParser
;

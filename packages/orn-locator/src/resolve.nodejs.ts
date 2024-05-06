// spell-checker: ignore domutils

import * as domutils from 'domutils';
import {parseDocument} from 'htmlparser2';
import nodeFetch from 'node-fetch';

declare var globalThis: any;

globalThis.parseDocument = parseDocument;
globalThis.domutils = domutils;
globalThis.fetch = nodeFetch;

export * from './resolve';

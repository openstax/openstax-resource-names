// spell-checker: ignore domutils

import * as domutils from 'domutils';
import {parseDocument} from 'htmlparser2';

declare let globalThis: any;

globalThis.parseDocument = parseDocument;
globalThis.domutils = domutils;

export * from './resolve';

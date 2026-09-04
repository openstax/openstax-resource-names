// spell-checker: ignore domutils

import * as domutils from 'domutils';
import {parseDocument} from 'htmlparser2';

const globals = globalThis as any;

globals.parseDocument = parseDocument;
globals.domutils = domutils;

export * from './resolve';

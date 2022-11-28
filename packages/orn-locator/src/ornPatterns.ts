import * as pathToRegexp from 'path-to-regexp';

const makePattern = <P extends object, R>({pattern, resolve}: {pattern: string; resolve: (params: P) => R}) => ({
  resolve,
  format: pathToRegexp.compile<P>(pattern),
  match: pathToRegexp.match<any>(pattern, {decode: decodeURIComponent}),
});

export const patterns = {
  library: makePattern({
    pattern: 'https\\://openstax.org/orn/library/:lang',
    resolve: ({lang}: {lang: string}) => import('./resolvers/books').then(mod => mod.library(lang)),
  }),
  book: makePattern({
    pattern: 'https\\://openstax.org/orn/book/:id',
    resolve: ({id}: {id: string}) => import('./resolvers/books').then(mod => mod.bookDetail(id)),
  }),
  'book:subbook': makePattern({
    pattern: 'https\\://openstax.org/orn/book\\:subbook/:bookId\\::subbookId',
    resolve: (params: {bookId: string; subbookId: string}) => import('./resolvers/books').then(mod => mod.subbook(params)),
  }),
  'book:page': makePattern({
    pattern: 'https\\://openstax.org/orn/book\\:page/:bookId\\::pageId',
    resolve: (params: {bookId: string; pageId: string}) => import('./resolvers/books').then(mod => mod.page(params)),
  }),
  'book:page:element': makePattern({
    pattern: 'https\\://openstax.org/orn/book\\:page\\:element/:bookId\\::pageId\\::elementId',
    resolve: (params: {bookId: string; pageId: string; elementId: string}) => import('./resolvers/books').then(mod => mod.element(params)),
  }),
};


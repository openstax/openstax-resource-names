import * as pathToRegexp from 'path-to-regexp';

const makePattern = <P extends object, R>({pattern, ...parts}: {
  pattern: string;
  name: string;
  resolve: (params: P) => Promise<R>;
  search?: (query: string, limit: number, filters: {[key: string]: string | string[]}) => Promise<R[]>;
}) => ({
  ...parts,
  format: pathToRegexp.compile<P>(pattern),
  match: pathToRegexp.match<any>(pattern, {decode: decodeURIComponent}),
});

export const patterns = {
  library: makePattern({
    name: 'Libraries',
    pattern: 'https\\://openstax.org/orn/library/:lang?',
    resolve: ({lang}: {lang: string}) => import('./resolvers/books').then(mod => mod.library(lang)),
    search: (...args) => import('./resolvers/books').then(mod => mod.librarySearch(...args))
  }),
  book: makePattern({
    name: 'Books',
    pattern: 'https\\://openstax.org/orn/book/:id',
    resolve: ({id}: {id: string}) => import('./resolvers/books').then(mod => mod.bookDetail(id)),
    search: (...args) => import('./resolvers/books').then(mod => mod.bookSearch(...args))
  }),
  'book:subbook': makePattern({
    name: 'Subbooks',
    pattern: 'https\\://openstax.org/orn/book\\:subbook/:bookId\\::subbookId',
    resolve: (params: {bookId: string; subbookId: string}) => import('./resolvers/books').then(mod => mod.subbook(params)),
  }),
  'book:page': makePattern({
    name: 'Pages',
    pattern: 'https\\://openstax.org/orn/book\\:page/:bookId\\::pageId',
    resolve: (params: {bookId: string; pageId: string}) => import('./resolvers/books').then(mod => mod.page(params)),
    search: (...args) => import('./resolvers/books').then(mod => mod.pageSearch(...args))
  }),
  'book:page:element': makePattern({
    name: 'Elements',
    pattern: 'https\\://openstax.org/orn/book\\:page\\:element/:bookId\\::pageId\\::elementId',
    resolve: (params: {bookId: string; pageId: string; elementId: string}) => import('./resolvers/books').then(mod => mod.element(params)),
    search: (...args) => import('./resolvers/books').then(mod => mod.elementSearch(...args))
  }),
};


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
    pattern: 'https\\://openstax.org/orn/{archive/:archivePath/}?book/:id{@:version}?',
    resolve: ({id, version, archivePath}: {id: string; version: string; archivePath: string}) => import('./resolvers/books').then(mod => mod.bookDetail(id, version, archivePath)),
    search: (...args) => import('./resolvers/books').then(mod => mod.bookSearch(...args))
  }),
  'book:subbook': makePattern({
    name: 'Subbooks',
    pattern: 'https\\://openstax.org/orn/{archive/:archivePath/}?book\\:subbook/:bookId{@:bookVersion}?\\::subbookId',
    resolve: (params: {archivePath?: string; bookId: string; bookVersion?: string; subbookId: string}) => import('./resolvers/books').then(mod => mod.subbook(params)),
  }),
  'book:page': makePattern({
    name: 'Pages',
    pattern: 'https\\://openstax.org/orn/{archive/:archivePath/}?book\\:page/:bookId{@:bookVersion}?\\::pageId',
    resolve: (params: {archivePath?: string; bookId: string; bookVersion?: string; pageId: string}) => import('./resolvers/books').then(mod => mod.page(params)),
    search: (...args) => import('./resolvers/books').then(mod => mod.pageSearch(...args))
  }),
  'book:page:element': makePattern({
    name: 'Elements',
    pattern: 'https\\://openstax.org/orn/{archive/:archivePath/}?book\\:page\\:element/:bookId{@:bookVersion}?\\::pageId\\::elementId',
    resolve: (params: {archivePath?: string; bookId: string; bookVersion?: string; pageId: string; elementId: string}) => import('./resolvers/books').then(mod => mod.element(params)),
    search: (...args) => import('./resolvers/books').then(mod => mod.elementSearch(...args))
  }),
};

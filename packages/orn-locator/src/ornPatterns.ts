// spell-checker: ignore subbook subbooks
import * as pathToRegexp from 'path-to-regexp';
import type { SearchServices } from './types/searchClient';

const makePattern = <P extends object, R>({pattern, ...parts}: {
  pattern: string;
  name: string;
  resolve: (params: P) => Promise<R>;
  search?: (services: SearchServices, query: string, limit: number) => Promise<R[]>;
  excludeFromDefaultSearch?: boolean;
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
    search: ({ornCacheStore}, ...args) => import('./resolvers/books').then(mod => mod.librarySearch(ornCacheStore, ...args)),
  }),
  book: makePattern({
    name: 'Books',
    pattern: 'https\\://openstax.org/orn/book/:bookId{@:bookVersion([^:/]+(?::[^:/]+)?)}?',
    resolve: ({bookId, bookVersion}: {bookId: string; bookVersion?: string}) => {
      const [bookContentVersion, bookArchiveVersion] = bookVersion ? bookVersion.split(':', 2) : [undefined, undefined];

      return import('./resolvers/books').then(mod => mod.bookDetail(bookId, bookContentVersion, bookArchiveVersion));
    },
    search: ({searchClient}, ...args) => import('./resolvers/books').then(mod => mod.bookSearch(searchClient, ...args)),
  }),
  'book:subbook': makePattern({
    name: 'Subbooks',
    pattern: 'https\\://openstax.org/orn/book\\:subbook/:bookId{@:bookVersion([^:/]+(?::[^:/]+)?)}?\\::subbookId',
    resolve: ({bookId, bookVersion, subbookId}: {bookId: string; bookVersion?: string; subbookId: string}) => {
      const [bookContentVersion, bookArchiveVersion] = bookVersion ? bookVersion.split(':', 2) : [undefined, undefined];

      return import('./resolvers/books').then(mod => mod.subbook({
        bookId,
        bookContentVersion,
        bookArchiveVersion,
        subbookId,
      }));
    },
  }),
  'book:page': makePattern({
    name: 'Pages',
    pattern: 'https\\://openstax.org/orn/book\\:page/:bookId{@:bookVersion([^:/]+(?::[^:/]+)?)}?\\::pageId',
    resolve: ({bookId, bookVersion, pageId}: {bookId: string; bookVersion?: string; pageId: string}) => {
      const [bookContentVersion, bookArchiveVersion] = bookVersion ? bookVersion.split(':', 2) : [undefined, undefined];

      return import('./resolvers/books').then(mod => mod.page({
        bookId,
        bookContentVersion,
        bookArchiveVersion,
        pageId
      }));
    },
    search: ({searchClient}, ...args) => import('./resolvers/books').then(mod => mod.pageSearch(searchClient, ...args)),
  }),
  'book:page:element': makePattern({
    name: 'Elements',
    pattern: 'https\\://openstax.org/orn/book\\:page\\:element/:bookId{@:bookVersion([^:/]+(?::[^:/]+)?)}?\\::pageId\\::elementId',
    resolve: ({bookId, bookVersion, pageId, elementId}: {bookId: string; bookVersion?: string; pageId: string; elementId: string}) => {
      const [bookContentVersion, bookArchiveVersion] = bookVersion ? bookVersion.split(':', 2) : [undefined, undefined];

      return import('./resolvers/books').then(mod => mod.element({
        bookId,
        bookContentVersion,
        bookArchiveVersion,
        pageId,
        elementId
      }));
    },
    search: ({searchClient}, ...args) => import('./resolvers/books').then(mod => mod.elementSearch(searchClient, ...args)),
    excludeFromDefaultSearch: true,
  }),
};

const allResolves = Object.values(patterns).map((pattern) => pattern.resolve);
export type AnyResolvedOrn = Awaited<ReturnType<typeof allResolves[number]>>;

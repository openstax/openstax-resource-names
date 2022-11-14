
export const patterns = {
  ['https\\://openstax.org/orn/library/:lang']: ({lang}: {lang: string}) => import('./resolvers/books').then(mod => mod.library(lang)),
  ['https\\://openstax.org/orn/book/:id']: ({id}: {id: string}) => import('./resolvers/books').then(mod => mod.bookDetail(id)),
  ['https\\://openstax.org/orn/book\\:subbook/:bookId\\::subbookId']: (params: any) => import('./resolvers/books').then(mod => mod.subbook(params)),
  ['https\\://openstax.org/orn/book\\:page/:bookId\\::pageId']: (params: any) => import('./resolvers/books').then(mod => mod.page(params)),
  ['https\\://openstax.org/orn/book\\:page\\:element/:bookId\\::pageId\\::elementId']: (params: any) => import('./resolvers/books').then(mod => mod.element(params)),
};

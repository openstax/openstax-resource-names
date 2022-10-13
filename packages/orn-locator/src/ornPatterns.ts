
export const patterns = {
  ['https\\://openstax.org/orn/content\\:book/:id']: ({id}: {id: string}) => import('./resolvers/books').then(mod => mod.book(id)),
  ['https\\://openstax.org/orn/content\\:page/:bookId([^:]+)\\::pageId']: (params: {bookId: string; pageId: string}) => import('./resolvers/books').then(mod => mod.page(params))
};

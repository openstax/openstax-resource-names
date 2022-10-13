
export const patterns = {
  ['https\\://openstax.org/orn/content\\:book/:id']: ({id}: {id: string}) => import('./resolvers/books').then(mod => mod.bookDetail(id)),
  ['https\\://openstax.org/orn/content\\:collection/:bookId\\::collectionId']: (params: any) => import('./resolvers/books').then(mod => mod.collection(params)),
  ['https\\://openstax.org/orn/content\\:page/:bookId\\::pageId']: (params: any) => import('./resolvers/books').then(mod => mod.page(params)),
  ['https\\://openstax.org/orn/content\\:element/:bookId\\::pageId\\::elementId']: (params: any) => import('./resolvers/books').then(mod => mod.element(params)),
};

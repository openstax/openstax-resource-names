import { memorySearchTheBadWay } from '@openstax/ts-utils/services/searchProvider/memorySearchTheBadWay';
import { ExampleDocumentStore } from './documentStoreMiddleware';

export const documentSearchMiddleware = <M extends {exampleDocumentStore: ExampleDocumentStore}>() => (middleware: M) => {
  return {
    ...middleware,
    exampleDocumentSearch: memorySearchTheBadWay(middleware.exampleDocumentStore),
  };
};

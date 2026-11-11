import { reindexTarget } from '@openstax/ts-utils/services/searchProvider/reindexTarget';
import {
  ExampleDocument,
  config as exampleDocumentConfig,
  searchIndexConfig as exampleDocumentIndexConfig,
} from '../serviceApi/versions/v0/example/documentStoreMiddleware';
import { config as searchConfig } from '../serviceApi/versions/v0/middleware/searchMiddleware';
import { LambdaServices } from './entry/lambda/services';

// union of every entrypoint's services, like AppServices in serviceApi
export type ReindexServices = LambdaServices;

/*
 * the stores that can be reindexed, add an entry here for each searchable store
 */
export const makeReindexTargets = (services: ReindexServices) => {
  const createSearchProvider = services.createSearchProvider(searchConfig);

  const exampleDocumentStore = services.versionedDocumentStore<ExampleDocument>()(exampleDocumentConfig)({}, 'id');

  return {
    exampleDocument: reindexTarget({
      scanItems: exampleDocumentStore.scanItems,
      search: createSearchProvider<ExampleDocument>(exampleDocumentIndexConfig),
      getDocumentId: (document) => document.id,
      getDocumentVersion: (document) => document.timestamp,
    }),
  };
};

export type ReindexTargets = ReturnType<typeof makeReindexTargets>;

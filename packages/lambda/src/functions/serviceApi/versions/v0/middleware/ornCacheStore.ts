import { AnyOrnLocateResponse } from '@openstax/orn-locator';
import { envConfig } from '@openstax/ts-utils/config';
import { AppServices } from '../../../core';

const config = {
  fileSystem: {
    tableName: 'ornCache'
  },
  dynamodb: {
    tableName: envConfig('ORN_CACHE_TABLE_NAME', 'runtime'),
  }
};

export const ornCacheStoreMiddleware = <M extends {}>(app: AppServices) => {
  // AnyResolvedOrn does not work here due to some incompatibility with TDocument
  const makeDocumentStore = app.unversionedDocumentStore<AnyOrnLocateResponse>()(config);

  return (middleware: M) => ({
    ...middleware,
    ornCacheStore: makeDocumentStore(middleware, 'orn'),
  });
};

export type OrnCacheStore = ReturnType<ReturnType<typeof ornCacheStoreMiddleware>>['ornCacheStore'];

import { AppServices } from '../../../core';
import { ornCacheStoreMiddleware } from './ornCacheStore';

describe('ornCacheStoreMiddleware', () => {
  it('adds ornCacheStore middleware', () => {
    const ornCacheStore = { testStore: true };
    const unversionedDocumentStore = jest.fn().mockReturnValue(() => () => ornCacheStore);
    const middleware = { testMiddleware: true };

    expect(
      ornCacheStoreMiddleware({ unversionedDocumentStore } as unknown as AppServices)(middleware)
    ).toEqual({ ...middleware, ornCacheStore });
  });
});

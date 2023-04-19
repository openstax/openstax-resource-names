import * as memorySearchModule from '@openstax/ts-utils/services/searchProvider/memorySearchTheBadWay';
import { documentSearchMiddleware } from './documentSearchMiddleware';
import { ExampleDocumentStore } from './documentStoreMiddleware';

describe('documentSearchMiddleware', () => {
  it('creates it', () => {
    const exampleDocumentStore = {loadAllDocumentsTheBadWay: () => Promise.resolve([])} as unknown as ExampleDocumentStore;
    const memorySearchSpy = jest.spyOn(memorySearchModule, 'memorySearchTheBadWay').mockImplementation(() => null as any);
    documentSearchMiddleware()({exampleDocumentStore});

    expect(memorySearchSpy).toHaveBeenCalledWith(exampleDocumentStore);
  });
});

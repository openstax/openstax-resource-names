import { createConsoleLogger } from '@openstax/ts-utils/services/logger/console';
import { config as exampleDocumentConfig, searchIndexConfig } from '../serviceApi/versions/v0/example/documentStoreMiddleware';
import { config as searchConfig } from '../serviceApi/versions/v0/middleware/searchMiddleware';
import { makeReindexTargets, ReindexServices } from './targets';

describe('makeReindexTargets', () => {
  const scanItems = jest.fn();
  const search = {deleteIndexIfExists: jest.fn(), ensureIndexCreated: jest.fn(), bulkIndex: jest.fn()};
  const makeStore = jest.fn().mockReturnValue({scanItems});
  const configureStore = jest.fn().mockReturnValue(makeStore);
  const versionedDocumentStore = jest.fn().mockReturnValue(configureStore);
  const createSearch = jest.fn().mockReturnValue(search);
  const createSearchProvider = jest.fn().mockReturnValue(createSearch);
  const services = {versionedDocumentStore, createSearchProvider} as unknown as ReindexServices;
  const logger = createConsoleLogger();

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('builds the example document target from the shared configs', () => {
    makeReindexTargets(services);

    expect(createSearchProvider).toHaveBeenCalledWith(searchConfig);
    expect(configureStore).toHaveBeenCalledWith(exampleDocumentConfig);
    expect(makeStore).toHaveBeenCalledWith({}, 'id');
    expect(createSearch).toHaveBeenCalledWith(searchIndexConfig);
  });

  it('indexes example documents from the store by id and timestamp', async() => {
    scanItems.mockResolvedValue({items: [{id: 'some id', timestamp: 1234}]});
    search.bulkIndex.mockResolvedValue({errors: []});
    const {exampleDocument} = makeReindexTargets(services);

    await exampleDocument(logger, {target: 'exampleDocument', pageToken: 'some token'});

    expect(scanItems).toHaveBeenCalledWith('some token');
    expect(search.bulkIndex).toHaveBeenCalledWith([
      {id: 'some id', body: {id: 'some id', timestamp: 1234}, version: 1234, version_type: 'external'},
    ]);
  });
});

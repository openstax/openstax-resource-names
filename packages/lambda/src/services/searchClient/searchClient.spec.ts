import { GenericFetch } from '@openstax/ts-utils/fetch';
import { createSearchClient } from './searchClient';

const config = {
  search: {
    searchHost: 'someHost/open-search',
  }
};

describe('createSearchClient', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.fn(() =>
      Promise.resolve({
        json: () => ({
          hits: {
            hits: [],
            total: 0,
          },
          overallTook: 0,
          shards: {},
          timedOut: false,
          took: 0,
        }),
        status: 200,
      })
    );
  });

  it('calls fetch on the searchHost', async() => {
    const client = createSearchClient({ fetch: fetchSpy as unknown as GenericFetch })(config);

    await client.search({
      books: ['book'],
      indexStrategy: '1',
      q: 'foo',
      searchStrategy: '1',
    });

    expect(fetchSpy.mock.calls[0][0]).toMatchInlineSnapshot('"someHost/open-search/api/v0/search?q=foo&books=book&index_strategy=1&search_strategy=1"');
  });
});

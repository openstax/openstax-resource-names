import { AppServices } from '../../../core';
import { config, searchMiddleware } from './searchMiddleware';

describe('searchMiddleware', () => {
  it('adds searchClient to middleware', () => {
    const searchClient = {};
    const createSearchClient = jest.fn().mockReturnValue(searchClient);
    const request = {};
    const middleware = searchMiddleware({createSearchClient} as unknown as AppServices)({request});
    expect(createSearchClient).toHaveBeenCalledWith(config);
    expect(middleware.request).toEqual(request);
    expect(middleware.searchClient).toEqual(searchClient);
  });
});

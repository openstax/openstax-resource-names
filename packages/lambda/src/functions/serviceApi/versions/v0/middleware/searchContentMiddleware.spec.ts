import { AppServices } from '../../../core';
import { config, searchContentMiddleware } from './searchContentMiddleware';

describe('searchMiddleware', () => {
  it('adds searchClient to middleware', () => {
    const searchClient = {};
    const createSearchClient = jest.fn().mockReturnValue(searchClient);
    const request = {};
    const middleware = searchContentMiddleware({createSearchClient} as unknown as AppServices)({request});
    expect(createSearchClient).toHaveBeenCalledWith(config);
    expect(middleware.request).toEqual(request);
    expect(middleware.searchContentClient).toEqual(searchClient);
  });
});

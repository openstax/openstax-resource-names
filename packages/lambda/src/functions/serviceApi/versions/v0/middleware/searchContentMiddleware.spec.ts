import { AppServices } from '../../../core';
import { config, searchContentMiddleware } from './searchContentMiddleware';

describe('searchMiddleware', () => {
  it('adds searchClient to middleware', () => {
    const searchClient = {};
    const createSearchContentClient = jest.fn().mockReturnValue(searchClient);
    const request = {};
    const middleware = searchContentMiddleware({createSearchContentClient} as unknown as AppServices)({request});
    expect(createSearchContentClient).toHaveBeenCalledWith(config);
    expect(middleware.request).toEqual(request);
    expect(middleware.searchContentClient).toEqual(searchClient);
  });
});

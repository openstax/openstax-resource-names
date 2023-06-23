import { apiRoutes } from './routes';

describe('routes', () => {
  it('aggregates api routes', () => {
    expect(apiRoutes()).toEqual(expect.any(Array));
  });
});

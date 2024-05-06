import { loadMorePaginationMiddleware, pageNumberPaginationMiddleware } from './paginationMiddleware';

it('is defined', () => {
  expect(loadMorePaginationMiddleware).toBeDefined();
});

it('is also defined', () => {
  expect(pageNumberPaginationMiddleware).toBeDefined();
});

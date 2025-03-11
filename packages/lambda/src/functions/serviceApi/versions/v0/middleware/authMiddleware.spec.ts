import { createCoreLogger } from '@openstax/ts-utils/services/logger';
import { ApiRouteRequest, AppServices } from '../../../core';
import { authMiddleware } from './authMiddleware';

describe('authMiddleware', () => {
  it('adds request cookies to auth provider', () => {
    const createAuthProvider = jest.fn();
    const request = {headers: {}, cookies: ['one=cookieOne', 'two=cookieTwo']} as unknown as ApiRouteRequest;
    const logger = createCoreLogger(jest.fn());
    const middleware = {request, logger};
    authMiddleware({createAuthProvider: () => createAuthProvider} as unknown as AppServices)(middleware);
    expect(createAuthProvider).toHaveBeenCalledWith(expect.objectContaining({request}));
  });

  it('works if there are no cookies', () => {
    const createAuthProvider = jest.fn();
    const request = {headers: {}} as unknown as ApiRouteRequest;
    const logger = createCoreLogger(jest.fn());
    const middleware = {request, logger};
    authMiddleware({createAuthProvider: () => createAuthProvider} as unknown as AppServices)(middleware);
    expect(createAuthProvider).toHaveBeenCalledWith(expect.objectContaining({request}));
  });
});

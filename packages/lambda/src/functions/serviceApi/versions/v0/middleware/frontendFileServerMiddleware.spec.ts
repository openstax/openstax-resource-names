import { ApiRouteRequest, AppServices } from '../../../core';
import { frontendFileServerMiddleware } from './frontendFileServerMiddleware';

describe('frontendFileServerMiddleware', () => {
  it('adds frontendFileServer to middleware stack', () => {
    const frontendFileServer = {};
    const createFileServer = jest.fn().mockReturnValue(frontendFileServer);
    const request = {} as unknown as ApiRouteRequest;
    const middleware = frontendFileServerMiddleware({ createFileServer } as unknown as AppServices)({request});
    expect(createFileServer).toHaveBeenCalledWith(expect.objectContaining({ local: { storagePrefix: '../../frontend' } }));
    expect(middleware.frontendFileServer).toBe(frontendFileServer);
  });
});

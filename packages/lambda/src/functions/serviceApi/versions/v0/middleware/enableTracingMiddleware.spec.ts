import { getKeyValue } from '@openstax/ts-utils';
import { Track } from '@openstax/ts-utils/profile';
import { ApiRouteRequest, AppServices } from '../../../core/types';
import { enableTracingMiddleware } from './enableTracingMiddleware';

describe('enableTracingMiddleware', () => {

  it('disables', () => {
    const app = {
      getEnvironmentConfig: getKeyValue('local')
    } as AppServices;

    const setTracing = jest.fn();
    const middleware = {
      request: {headers: {}} as ApiRouteRequest,
      profile: {setTracing} as unknown as Track 
    };

    enableTracingMiddleware(app)(middleware);

    expect(setTracing).toHaveBeenCalled();
    expect(setTracing.mock.calls[0][0]).toBe(false);
  });
  
  it('enables when query param is passed', async () => {
    const app = {
      getEnvironmentConfig: getKeyValue('local')
    } as AppServices;

    const setTracing = jest.fn();
    const middleware = {
      request: {headers: {}, queryStringParameters: {profile: 'json'}} as unknown as ApiRouteRequest,
      profile: {setTracing} as unknown as Track 
    };

    enableTracingMiddleware(app)(middleware);

    expect(setTracing).toHaveBeenCalled();
    await expect(setTracing.mock.calls[0][0]).resolves.toBe(true);
  });
  
  it('enables when header is passed', async () => {
    const app = {
      getEnvironmentConfig: getKeyValue('local')
    } as AppServices;

    const setTracing = jest.fn();
    const middleware = {
      request: {headers: {'x-application-profile': 'trace'}, queryStringParameters: {}} as unknown as ApiRouteRequest,
      profile: {setTracing} as unknown as Track 
    };

    enableTracingMiddleware(app)(middleware);

    expect(setTracing).toHaveBeenCalled();
    await expect(setTracing.mock.calls[0][0]).resolves.toBe(true);
  });
});

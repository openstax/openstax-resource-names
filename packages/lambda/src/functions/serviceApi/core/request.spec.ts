import { getKeyValue } from '@openstax/ts-utils';
import { InvalidRequestError, NotFoundError, UnauthorizedError } from '@openstax/ts-utils/errors';
import { apiJsonResponse, METHOD } from '@openstax/ts-utils/routing';
import { APIGatewayProxyEventV2 } from 'aws-lambda/trigger/api-gateway-proxy';
import { corsResponseMiddleware, default404Middleware, errorHandler, pathExtractor, routeMatcher } from './request';
import { ApiRouteRequest, ApiRouteResponse } from './types';

describe('pathExtractor', () => {
  it('extracts path from request', () => {
    expect(pathExtractor({requestContext: {http: {path: '/asdf/foo'}}} as ApiRouteRequest)).toBe('/asdf/foo');
  });
});

describe('routeMatcher', () => {
  it('positive matches', () => {
    expect(routeMatcher({requestContext: {http: {method: 'GET'}}} as ApiRouteRequest, {method: METHOD.GET})).toBe(true);
  });
  it('negative matches', () => {
    expect(routeMatcher({requestContext: {http: {method: 'GET'}}} as ApiRouteRequest, {method: METHOD.POST})).toBe(false);
  });
});

describe('errorHandler', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'error').mockReturnValue(null as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
    logSpy.mockRestore();
  });
  it('handles UnauthorizedError with 401', async() => {
    expect(await errorHandler(new UnauthorizedError())).toEqual(expect.objectContaining({statusCode: 401}));
  });
  it('handles InvalidRequestError with 400', async () => {
    expect(await errorHandler(new InvalidRequestError())).toEqual(expect.objectContaining({statusCode: 400}));
  });
  it('handles NotFoundError with 404', async () => {
    expect(await errorHandler(new NotFoundError())).toEqual(expect.objectContaining({statusCode: 404}));
  });
  it('handles unknown error with 500', async() => {
    expect(await errorHandler(new Error())).toEqual(expect.objectContaining({statusCode: 500}));
  });
  it('logs unknown error', async () => {
    await errorHandler(new Error());
    expect(logSpy).toHaveBeenCalled();
  });
});

describe('corsResponseMiddleware', () => {
  it('adds cors headers for openstax subdomains', async() => {
    const request = {
      cookies: [],
      headers: {
        origin: 'https://neato.openstax.org'
      },
      requestContext: {
        http: {
          method: 'GET'
        }
      }
    } as unknown as APIGatewayProxyEventV2;

    const response = await corsResponseMiddleware({getEnvironmentConfig: getKeyValue('deployed')})(
      Promise.resolve(apiJsonResponse(200, {})), {request}
    );

    expect(response?.headers?.['Access-Control-Allow-Origin']).toBe('https://neato.openstax.org');
    expect(response?.headers?.['Access-Control-Allow-Methods']).toBe('POST, GET, OPTIONS');
  });

  it('adds cors headers for openstax apex', async() => {
    const request = {
      cookies: [],
      headers: {
        origin: 'https://openstax.org'
      },
      requestContext: {
        http: {
          method: 'GET'
        }
      }
    } as unknown as APIGatewayProxyEventV2;

    const response = await corsResponseMiddleware({getEnvironmentConfig: getKeyValue('deployed')})(
      Promise.resolve(apiJsonResponse(200, {})), {request}
    );

    expect(response?.headers?.['Access-Control-Allow-Origin']).toBe('https://openstax.org');
    expect(response?.headers?.['Access-Control-Allow-Methods']).toBe('POST, GET, OPTIONS');
  });

  it('omits headers without origin', async() => {
    const request = {
      cookies: [],
      headers: {
      },
      requestContext: {
        http: {
          method: 'GET'
        }
      }
    } as unknown as APIGatewayProxyEventV2;

    const response = await corsResponseMiddleware({getEnvironmentConfig: getKeyValue('deployed')})(
      Promise.resolve(apiJsonResponse(200, {})), {request}
    );

    expect(response?.headers?.['Access-Control-Allow-Origin']).toBeUndefined();
    expect(response?.headers?.['Access-Control-Allow-Methods']).toBeUndefined();
  });

  it('forwards undefined response if its not options', async() => {
    const request = {
      cookies: [],
      headers: {
      },
      requestContext: {
        http: {
          method: 'GET'
        }
      }
    } as unknown as APIGatewayProxyEventV2;

    const response = await corsResponseMiddleware({getEnvironmentConfig: getKeyValue('deployed')})(undefined, {request});

    expect(response).toBeUndefined();
  });

  it('responds to options', async() => {
    const request = {
      cookies: [],
      headers: {
        origin: 'https://openstax.org'
      },
      requestContext: {
        http: {
          method: 'OPTIONS'
        }
      }
    } as unknown as APIGatewayProxyEventV2;

    const response = await corsResponseMiddleware({getEnvironmentConfig: getKeyValue('deployed')})(undefined, {request});

    expect(response?.headers?.['Access-Control-Allow-Origin']).toBe('https://openstax.org');
    expect(response?.headers?.['Access-Control-Allow-Methods']).toBe('POST, GET, OPTIONS');
  });
});

describe('default404Middleware', () => {
  it('defaults to 404', async() => {
    const default404MiddlewareNoResponse = () => default404Middleware()(undefined);

    // Normally caught by the default errorHandler
    expect(default404MiddlewareNoResponse).toThrow(NotFoundError);
    expect(default404MiddlewareNoResponse).toThrow('not found');
  });

  it('keeps response', async() => {
    const initial = {} as ApiRouteResponse;
    const response = await default404Middleware()(Promise.resolve(initial));

    expect(response).toBe(initial);
  });
});

/* spell-checker: ignore herokuapp */
import { flow, getKeyValueOr } from '@openstax/ts-utils';
import { resolveConfigValue } from '@openstax/ts-utils/config';
import { InvalidRequestError, NotFoundError, UnauthorizedError } from '@openstax/ts-utils/errors';
import { makeComposeMiddleware } from '@openstax/ts-utils/middleware';
import { makeProfileApiResponseMiddleware } from '@openstax/ts-utils/profile';
import { apiTextResponse, makeGetRequestResponder } from '@openstax/ts-utils/routing';
import { METHOD } from '@openstax/ts-utils/routing';
import { apiRoutes, TRoutes } from './routes';
import { ApiRouteRequest, ApiRouteResponse, AppServices } from './types';

export const errorHandler = async(e: Error) => {
  if (UnauthorizedError.matches(e)) {
    return apiTextResponse(401, '401 UnauthorizedError');
  }
  if (NotFoundError.matches(e)) {
    return apiTextResponse(404, e.message || '404 NotFoundError');
  }
  if (InvalidRequestError.matches(e)) {
    return apiTextResponse(400, e.message || '400 InvalidRequestError');
  }
  console.error(JSON.stringify({
    eventType: 'ERROR',
    name: e.name,
    message: e.message,
    stack: e.stack,
  }));
  return apiTextResponse(500, '500 Error');
};

const config = {
  local: {
    corsAllowedHostRegex: 'localhost'
  },
  deployed: {
    corsAllowedHostRegex: '(\\.local|localhost|openstax.org|rex-web(-production)?\\.herokuapp\\.com)$'
  }
};

export const corsResponseMiddleware = ({getEnvironmentConfig}: Pick<AppServices, 'getEnvironmentConfig'>) => (responsePromise: Promise<ApiRouteResponse> | undefined, {request}: {request: ApiRouteRequest}): Promise<ApiRouteResponse> | undefined => {

  const cors = async () => {
    const allowedHost = await resolveConfigValue(getEnvironmentConfig(config).corsAllowedHostRegex);

    if (request.headers.origin && new URL(request.headers.origin).hostname.match(new RegExp(allowedHost))) {
      return {
        'Access-Control-Allow-Origin': request.headers.origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      };
    }
  };

  if (responsePromise) {
    return responsePromise.then(async response => {
      response.headers = {
        ...await cors(),
        ...response.headers
      };
      return response;
    });
  }

  if (request.requestContext.http.method === 'OPTIONS') {
    return cors().then(headers => apiTextResponse(200, '', headers));
  }

  return responsePromise;
};

export const default404Middleware = () => (response: Promise<ApiRouteResponse> | undefined): Promise<ApiRouteResponse> => {
  if (!response) {
    throw new NotFoundError('not found');
  }
  return response;
};

export const pathExtractor = (request: ApiRouteRequest) =>
  request.requestContext.http.path
;

export const routeMatcher = (request: ApiRouteRequest, route: {method: METHOD}) => {
  return request.requestContext.http.method === route.method;
};

export const composeResponseMiddleware = makeComposeMiddleware<AppServices, Promise<ApiRouteResponse> | undefined>();

export const profileReportMiddleware = makeProfileApiResponseMiddleware<ApiRouteRequest>(
  flow(
    // the flow types try to resolve the I/O of these functions, which resolve to `any` without specific input unless specified
    getKeyValueOr<'queryStringParameters', NonNullable<ApiRouteRequest['queryStringParameters']>, ApiRouteRequest>('queryStringParameters', {}),
    getKeyValueOr<'profile', string | false, NonNullable<ApiRouteRequest['queryStringParameters']>>('profile', false)
  )
);

export const getRequestResponder = makeGetRequestResponder<AppServices, TRoutes, ApiRouteRequest, Promise<ApiRouteResponse>>()({
  routes: apiRoutes,
  pathExtractor,
  routeMatcher,
  errorHandler,
});

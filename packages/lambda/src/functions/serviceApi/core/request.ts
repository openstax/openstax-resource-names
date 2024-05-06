/* spell-checker: ignore herokuapp */
import { envConfig } from '@openstax/ts-utils/config';
import { makeComposeMiddleware } from '@openstax/ts-utils/middleware';
import { createErrorHandler } from '@openstax/ts-utils/middleware/apiErrorHandler';
import { createSlowResponseMiddleware } from '@openstax/ts-utils/middleware/apiSlowResponseMiddleware';
import { makeGetRequestResponder } from '@openstax/ts-utils/routing';
import { METHOD } from '@openstax/ts-utils/routing';
import { apiRoutes, TRoutes } from './routes';
import { ApiRouteRequest, ApiRouteResponse, AppServices } from './types';

export const errorHandler = createErrorHandler();

export const slowResponseMiddleware = createSlowResponseMiddleware({
  logResponseSlowerThan: envConfig('LOG_SLOW_RESPONSE', 'runtime', '1000'),
  timeoutResponseAfter: envConfig('RESPONSE_TIMEOUT', 'runtime', '28000'),
});

export const pathExtractor = (request: ApiRouteRequest) =>
  request.requestContext.http.path
;

export const logExtractor = (request: ApiRouteRequest) =>
  request.requestContext.http
;

export const routeMatcher = (request: ApiRouteRequest, route: {method: METHOD}) => {
  return request.requestContext.http.method === route.method;
};

export const composeResponseMiddleware = makeComposeMiddleware<AppServices, Promise<ApiRouteResponse> | undefined>();

export const getRequestResponder = makeGetRequestResponder<AppServices, TRoutes, ApiRouteRequest, Promise<ApiRouteResponse>>()({
  routes: apiRoutes,
  pathExtractor,
  routeMatcher,
  errorHandler,
  logExtractor,
});

import { makeComposeMiddleware } from '@openstax/ts-utils/middleware';
import { makeCreateRoute, METHOD } from '@openstax/ts-utils/routing';
import { Logger } from '@openstax/ts-utils/services/logger';
import { ApiRouteRequest, AppServices } from './types';

export const composeServiceMiddleware = makeComposeMiddleware<AppServices, {request: ApiRouteRequest; logger: Logger}>();
export const createRoute = makeCreateRoute<AppServices, ApiRouteRequest, {
  method: METHOD;
}>();

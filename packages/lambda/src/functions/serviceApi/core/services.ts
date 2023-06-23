import { makeComposeMiddleware } from '@openstax/ts-utils/middleware';
import { Track } from '@openstax/ts-utils/profile';
import { makeCreateRoute, METHOD } from '@openstax/ts-utils/routing';
import { ApiRouteRequest, AppServices } from './types';

export const composeServiceMiddleware = makeComposeMiddleware<AppServices, {request: ApiRouteRequest; profile: Track}>();
export const createRoute = makeCreateRoute<AppServices, ApiRouteRequest, {
  method: METHOD;
}>();

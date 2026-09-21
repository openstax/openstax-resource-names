import type {TRoutes as ApiRoutes} from '@project/lambdas/build/src/functions/serviceApi/core/routes';
import routes from '@project/lambdas/build/routeData.json';
import type { createApiGateway } from '@openstax/ts-utils/services/apiGateway';
import {assertDefined} from "@openstax/ts-utils/assertions";
import { useServices } from "./core/context/services";

/*
 * shared with the config provider, which builds its own gateway - see the comment
 * there for why that one is separate.
 */
export const config = {
  apiBase: () => import.meta.env.PROD
    ? assertDefined(import.meta.env.VITE_API_BASE_URL, 'VITE_API_BASE_URL must be provided in production')
    : '/'
};

/*
 * takes the gateway factory plus only the slice of services the gateway itself uses,
 * rather than the whole container. that is what lets index.tsx build the client at
 * module scope and put it *into* the services object - taking AppServices here would
 * mean the client could only be built after the container exists, ie. inside React,
 * and anything running before that (the analytics loader) would need its own.
 */
export const createApiClient = (
  makeApiGateway: ReturnType<typeof createApiGateway>,
  services: Parameters<ReturnType<typeof createApiGateway>>[2]
) => {
  return makeApiGateway<ApiRoutes>(config, routes, services);
};

export const useApiClient = () => useServices().apiClient;

export type ApiClient = ReturnType<typeof createApiClient>;

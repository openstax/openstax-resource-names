import {TRoutes as ApiRoutes} from '@project/lambdas/build/src/functions/serviceApi/core/routes';
import routes from '@project/lambdas/build/routeData.json';
import { AppServices } from "../core/types";
import { useServices } from "../core/context/services";
import {assertDefined} from "@openstax/ts-utils/assertions";
import React from 'react';

const config = {
  apiBase: () => import.meta.env.PROD
    ? assertDefined(import.meta.env.VITE_API_BASE_URL, 'VITE_API_BASE_URL must be provided in production')
    : '/'
};

export const createApiClient = (app: AppServices) => {
  return app.createApiGateway<ApiRoutes>(config, routes, app);
};

export const useApiClient = () => {
  const services = useServices();
  return React.useMemo(() => createApiClient(services), [services]);
};


export type ApiClient = ReturnType<typeof createApiClient>;

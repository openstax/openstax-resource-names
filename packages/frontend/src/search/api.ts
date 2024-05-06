/* eslint-disable import/no-webpack-loader-syntax */
import {TRoutes as ApiRoutes} from '@project/lambdas/build/src/functions/serviceApi/core/routes';
// @ts-ignore-next-line
import routes from '!!val-loader!@project/lambdas/build/script/utils/routeDataLoader';
import { AppServices } from "../core/types";
import { useServices } from "../core/context/services";
import {assertDefined} from "@openstax/ts-utils/assertions";
import React from 'react';

// TODO - figure out how to wire the envConfig into the CRA build
const config = {
  apiBase: () => process.env.NODE_ENV === 'production'
    ? assertDefined(process.env.REACT_APP_API_BASE_URL, 'REACT_APP_API_BASE_URL must be provided in production')
    : '/'
};

export const createApiClient = (app: AppServices) => {
  return app.createApiGateway<ApiRoutes>(config, routes, app.authProvider);
};

export const useApiClient = () => {
  const services = useServices();
  const apiClientRef = React.useRef(createApiClient(services));
  return apiClientRef.current;
};


export type ApiClient = ReturnType<typeof createApiClient>;

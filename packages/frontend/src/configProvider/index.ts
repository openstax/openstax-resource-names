/* eslint-disable import/no-webpack-loader-syntax */
import {TRoutes as ApiRoutes} from '@project/lambdas/build/src/functions/serviceApi/core/routes';
import { once } from '@openstax/ts-utils';
import type { createApiGateway } from '@openstax/ts-utils/services/apiGateway';
// @ts-ignore-next-line
import routes from '!!val-loader!@project/lambdas/build/script/utils/routeDataLoader';

const config = {
  apiBase: () => '/'
};

export type FrontendConfig = Awaited<ReturnType<ReturnType<typeof loadConfig>>>;

const getApiGateway = (makeApiGateway: ReturnType<typeof createApiGateway>) => {
  return makeApiGateway<ApiRoutes>(config, routes);
};

const loadConfig = (apiGateway: ReturnType<typeof getApiGateway>) => async() => {
  const response = await apiGateway.apiV0Info({});
  const loadedResponse = await response.acceptStatus(200).load();
  return loadedResponse.config;
};

export const frontendConfigProvider = (makeApiGateway: ReturnType<typeof createApiGateway>) => {
  const apiGateway = getApiGateway(makeApiGateway);
  const getConfig = once(loadConfig(apiGateway));

  const getValue = async(name: keyof FrontendConfig) => {
    const frontendConfig = await getConfig();
    if (name in frontendConfig) {
      return frontendConfig[name];
    }
    throw new Error(`Frontend Config variable ${name} not found in in /api/v0/info`);
  };

  return { getConfig, getValue };
};


export type FrontendConfigProvider = ReturnType<typeof frontendConfigProvider>;

/* eslint-disable import/no-webpack-loader-syntax */
import { TRoutes as ApiRoutes } from '@project/lambdas/build/src/functions/serviceApi/core/routes';
import type {
  FrontendConfigProvider as LambdaFrontendConfigProvider
} from '@project/lambdas/build/src/functions/serviceApi/versions/v0';
import { once } from '@openstax/ts-utils';
import { ConfigForConfigProvider } from '@openstax/ts-utils/config';
import type { createApiGateway } from '@openstax/ts-utils/services/apiGateway';
// @ts-ignore-next-line
import routes from '!!val-loader!@project/lambdas/build/script/utils/routeDataLoader';

export type FrontendConfig = ConfigForConfigProvider<LambdaFrontendConfigProvider>;

const config = {
  apiBase: () => '/'
};

const getApiGateway = (makeApiGateway: ReturnType<typeof createApiGateway>) => {
  return makeApiGateway<ApiRoutes>(config, routes);
};

declare global {
  interface Window {
    _OX_FRONTEND_CONFIG?: FrontendConfig;
  }
}

const loadConfig = (apiGateway: ReturnType<typeof getApiGateway>) => async() => {
  if (window._OX_FRONTEND_CONFIG) { return window._OX_FRONTEND_CONFIG; }

  // For backwards compatibility. Remove if the frontend config is removed from this API.
  const response = await apiGateway.apiV0Info({});
  const loadedResponse = await (await response.acceptStatus(200)).load();
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

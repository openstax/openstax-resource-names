/* eslint-disable import/no-webpack-loader-syntax */
import {TRoutes as ApiRoutes} from '@project/lambdas/build/src/functions/serviceApi/core/routes';
import { once } from '@openstax/ts-utils';
import type { createApiGateway } from '@openstax/ts-utils/services/apiGateway';
// @ts-ignore-next-line
import routes from '!!val-loader!@project/lambdas/build/script/utils/routeDataLoader';

const config = {
  apiBase: () => '/'
};

export const frontendConfigProvider = (makeApiGateway: ReturnType<typeof createApiGateway>) => {
  const apiGateway = makeApiGateway<ApiRoutes>(config, routes);

  const getConfig = once(
    async() => {
      const response = await apiGateway.apiV0Info({});
      const loadedResponse = await response.acceptStatus(200).load();
      return loadedResponse.config;
    }
  );

  const getValue = async(name: string) => {
    const frontendConfig = await getConfig();
    if (name in frontendConfig) {
      return frontendConfig[name];
    }
    throw new Error(`Frontend Config variable ${name} not found in in /api/v0/info`);
  };

  return { getConfig, getValue };
};


export type FrontendConfigProvider = ReturnType<typeof frontendConfigProvider>;

import { envConfig, resolveConfigValue } from '@openstax/ts-utils/config';
import { apiJsonResponse, METHOD } from '@openstax/ts-utils/routing';
import { composeServiceMiddleware, createRoute } from '../../core/services';
import { apiV0ExampleRoutes } from './example/routes';
import { authMiddleware } from './middleware/authMiddleware';
import { getEnvironmentConfig } from './middleware/configMiddleware';
import { enableTracingMiddleware } from './middleware/enableTracingMiddleware';

// frontendConfig values are visible to all users
const configProvider = getEnvironmentConfig({
  local: {
    codeVersion: 'dev',
    frontendConfig: {
      REACT_APP_CONFIG_EXAMPLE_MESSAGE: envConfig('REACT_APP_CONFIG_EXAMPLE_MESSAGE', 'runtime', 'hello from /api/v0/info'),
    },
  },
  deployed: {
    codeVersion: envConfig('CODE_VERSION'),
    frontendConfig: {
      REACT_APP_SELECT_CONTENT_URL: envConfig('REACT_APP_CONFIG_EXAMPLE_MESSAGE', 'runtime'),
    },
  },
});

const requestServiceProvider = composeServiceMiddleware(
  enableTracingMiddleware,
  authMiddleware,
  configProvider,
);

export const apiV0Index = createRoute({name: 'apiV0Info', method: METHOD.GET, path: '/api/v0/info',
  requestServiceProvider},
  async(_params: undefined, services) => {
    const user = await services.authProvider.getUser();

    const config: { [key: string]: string } = {};
    await Promise.all(Object.entries(services.environmentConfig.frontendConfig).map(
      async([name, value]) => config[name] = await resolveConfigValue(value)
    ));

    return apiJsonResponse(200, {
      message: `greetings from the api controller${user ? ` ${user.name}`: ''}`,
      code: await resolveConfigValue(services.environmentConfig.codeVersion),
      config,
    });
  }
);

export const apiV0Routes = () => ([
  apiV0Index,
  ...apiV0ExampleRoutes(),
]);

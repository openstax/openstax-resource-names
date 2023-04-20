import { envConfig, resolveConfigValue } from '@openstax/ts-utils/config';
import { apiJsonResponse, METHOD } from '@openstax/ts-utils/routing';
import { composeServiceMiddleware, createRoute } from '../../core/services';
import { authMiddleware } from './middleware/authMiddleware';
import { getEnvironmentConfig } from './middleware/configMiddleware';
import { enableTracingMiddleware } from './middleware/enableTracingMiddleware';
import { apiV0OrnRoutes } from './routes/ornRoutes';

// frontendConfig values are visible to all users
const configProvider = getEnvironmentConfig({
  local: {
    codeVersion: 'dev',
    frontendConfig: {
      EXAMPLE_MESSAGE: envConfig('EXAMPLE_MESSAGE', 'runtime', 'hello from /api/v0/info'),
    },
  },
  deployed: {
    codeVersion: envConfig('CODE_VERSION'),
    frontendConfig: {
      EXAMPLE_MESSAGE: envConfig('EXAMPLE_MESSAGE', 'runtime'),
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
  ...apiV0OrnRoutes(),
]);

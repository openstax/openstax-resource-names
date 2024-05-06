import { ConfigForConfigProvider, envConfig, lambdaParameterConfig, replaceConfig, resolveConfigValue } from '@openstax/ts-utils/config';
import { apiJsonResponse, METHOD } from '@openstax/ts-utils/routing';
import { composeServiceMiddleware, createRoute } from '../../core/services';
import { getEnvironmentConfig } from './middleware/configMiddleware';
import { roleValidatorConfig } from './middleware/userRoleValidatorMiddleware';
import { apiV0OrnRoutes } from './routes/ornRoutes';

// frontendConfig values are visible to all users
const configProvider = getEnvironmentConfig({
  local: {
    codeVersion: 'dev',
    frontendConfig: {
      roleApplication: roleValidatorConfig.application,
      accountsBase: envConfig('ACCOUNTS_BASE', 'runtime', 'https://dev.openstax.org/accounts'),
    },
  },
  deployed: {
    codeVersion: envConfig('CODE_VERSION'),
    frontendConfig: {
      roleApplication: roleValidatorConfig.application,
      accountsBase: lambdaParameterConfig(
        replaceConfig('/[app]/[env]/api/AccountsBase', {
          '[app]': envConfig('APPLICATION'),
          '[env]': envConfig('ENV_NAME', 'runtime')
        })
      ),
    },
  },
});

const requestServiceProvider = composeServiceMiddleware(
  configProvider,
);

export const apiV0Index = createRoute({name: 'apiV0Info', method: METHOD.GET, path: '/api/v0/info',
  requestServiceProvider},
  async(_params: undefined, services) => {
    const config: { [key: string]: string } = {};
    await Promise.all(Object.entries(services.environmentConfig.frontendConfig).map(
      async([name, value]) => config[name] = await resolveConfigValue(value)
    ));

    return apiJsonResponse(200, {
      code: await resolveConfigValue(services.environmentConfig.codeVersion),
      config: config as ConfigForConfigProvider<typeof services.environmentConfig.frontendConfig>,
    });
  }
);

export const apiV0Routes = () => ([
  apiV0Index,
  ...apiV0OrnRoutes(),
]);

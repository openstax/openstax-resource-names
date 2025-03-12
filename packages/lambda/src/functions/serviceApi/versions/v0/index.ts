import { ConfigForConfigProvider, ConfigValueProvider, envConfig, lambdaParameterConfig, replaceConfig, resolveConfigValue } from '@openstax/ts-utils/config';
import { once } from '@openstax/ts-utils/misc/helpers';
import { apiHtmlResponse, apiJsonResponse, METHOD } from '@openstax/ts-utils/routing';
import { FileServerAdapter } from '@openstax/ts-utils/services/fileServer';
import { composeServiceMiddleware, createRoute } from '../../core/services';
import { authMiddleware } from './middleware/authMiddleware';
import { getEnvironmentConfig } from './middleware/configMiddleware';
import { frontendFileServerMiddleware } from './middleware/frontendFileServerMiddleware';
import { roleValidatorConfig } from './middleware/userRoleValidatorMiddleware';
import { apiV0OrnRoutes } from './routes/ornRoutes';

// frontendConfig values are visible to all users
const configProvider = getEnvironmentConfig({
  local: {
    codeVersion: 'dev',
    maintenanceMessage: envConfig('MAINTENANCE_MESSAGE', 'runtime', ''),
    frontendConfig: {
      roleApplication: roleValidatorConfig.application,
      accountsBase: envConfig('ACCOUNTS_BASE', 'runtime', '/accounts'),
    },
  },
  deployed: {
    codeVersion: envConfig('CODE_VERSION'),
    maintenanceMessage: envConfig('MAINTENANCE_MESSAGE', 'runtime', ''),
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
  authMiddleware,
  configProvider,
);

type EnvironmentConfigProvider = ReturnType<ReturnType<typeof configProvider>>['environmentConfig'];
export type FrontendConfigProvider = EnvironmentConfigProvider['frontendConfig'];

const resolveFrontendConfig = once(async(frontendConfig: FrontendConfigProvider) => {
  const config: Record<string, ConfigValueProvider<string>> = {};

  await Promise.all(Object.entries(frontendConfig).map(
    async([name, value]) => config[name] = await resolveConfigValue(value)
  ));

  return config as ConfigForConfigProvider<FrontendConfigProvider>;
});

export const makeIndexHtmlBody = async(fileServer: FileServerAdapter, config: EnvironmentConfigProvider) => {
  const frontendConfig = await resolveFrontendConfig(config.frontendConfig);
  const maintenanceMessage = await resolveConfigValue(config.maintenanceMessage);
  const bodyFile = maintenanceMessage ? 'maintenance' : 'index';

  let body = (await fileServer.getFileContent({
    dataType: 'file',
    mimeType: 'text/html',
    path: `build/${bodyFile}.html`,
    label: `${bodyFile}.html`,
  })).toString();

  if (maintenanceMessage) {
    body = body.replace('<body>', `<body>${maintenanceMessage}`);
  }

  return body.replace(
    '<head>',
    `<head>
      <script>window._OX_FRONTEND_CONFIG = ${JSON.stringify(frontendConfig)};</script>`
  );
};

const indexHtmlBody = once(makeIndexHtmlBody);

export const apiV0Index = createRoute({name: 'apiV0Info', method: METHOD.GET, path: '/api/v0/info',
  requestServiceProvider},
  async(_params: undefined, services) => {
    // This config is here for backwards compatibility and can eventually be removed
    const config = await resolveFrontendConfig(services.environmentConfig.frontendConfig);

    return apiJsonResponse(200, {
      code: await resolveConfigValue(services.environmentConfig.codeVersion),
      config: config,
    });
  }
);

export const buildIndex = createRoute({name: 'buildIndex', method: METHOD.GET, path: '/build/index.html',
  requestServiceProvider: composeServiceMiddleware(
    requestServiceProvider,
    frontendFileServerMiddleware,
  )},
  async(_params: undefined, services) => {
    const user = await services.authProvider.getUser();

    // Frontend config is already included
    const originalBody = await indexHtmlBody(services.frontendFileServer, services.environmentConfig);

    // Add os-subcontent body class if subcontent queryStringParameter is set to true
    const bodyWithSubcontent = services.request.queryStringParameters?.subcontent === 'true' ? originalBody.replace(
      '<body>', '<body class="os-subcontent">'
    ) : originalBody;

    // Add _OX_USER_DATA if logged in
    const body = user ? bodyWithSubcontent.replace(
      '<head>',
      `<head>
        <script>window._OX_USER_DATA = ${JSON.stringify(user)};</script>`
    ): bodyWithSubcontent;

    return apiHtmlResponse(200, body, { 'cache-control': 'no-cache' });
  }
);

export const apiV0Routes = () => ([
  apiV0Index,
  buildIndex,
  ...apiV0OrnRoutes(),
]);

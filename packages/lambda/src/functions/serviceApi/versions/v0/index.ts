import { ConfigForConfigProvider, ConfigValueProvider, envConfig, resolveConfigValue } from '@openstax/ts-utils/config';
import { once } from '@openstax/ts-utils/misc/helpers';
import { apiHtmlResponse, apiJsonResponse, METHOD, routesList } from '@openstax/ts-utils/routing';
import { TokenUser } from '@openstax/ts-utils/services/authProvider';
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
      accountsBase: envConfig('ACCOUNTS_BASE', 'runtime'),
    },
  },
});

const requestServiceProvider = composeServiceMiddleware(
  authMiddleware,
  configProvider,
);

type EnvironmentConfigProvider = ReturnType<ReturnType<typeof configProvider>>['environmentConfig'];
export type FrontendConfigProvider = EnvironmentConfigProvider['frontendConfig'];

const resolveFrontendConfig = once(async(frontendConfig: FrontendConfigProvider, codeVersion: ConfigValueProvider<string>) => {
  const config: Record<string, ConfigValueProvider<string>> = {};

  await Promise.all(Object.entries({...frontendConfig, releaseId: codeVersion}).map(
    async([name, value]) => config[name] = await resolveConfigValue(value)
  ));

  return config as ConfigForConfigProvider<FrontendConfigProvider>;
});

/*
 * cached by path rather than with once(), which ignores its arguments and would
 * hand every caller whichever document was requested first. that is invisible while
 * there is one entry point and wrong the moment a project adds a second one.
 */
const htmlFileCache = new Map<string, string>();
const getHtmlFileContent = async(services: {frontendFileServer: FileServerAdapter}, path: string) => {
  const cached = htmlFileCache.get(path);
  if (cached !== undefined) { return cached; }

  const chunks = path.split('/');
  const body = (await services.frontendFileServer.getFileContent({
    dataType: 'file',
    mimeType: 'text/html',
    path,
    label: chunks[chunks.length - 1],
  })).toString();

  htmlFileCache.set(path, body);

  return body;
};

/*
 * state aware config tier. unlike frontendConfig above, this is resolved fresh on
 * every request, user authenticated, and deliberately not memoized
 */
const resolveSessionConfig = () => ({
  /* stubbed - any user specific values that need to get into the FE can go here. */
  disableAnalytics: false,
});

export type SessionConfig = ReturnType<typeof resolveSessionConfig>;

export const apiV0Index = createRoute({name: 'apiV0Info', method: METHOD.GET, path: '/api/v0/info',
  requestServiceProvider},
  async(_params: undefined, services) => {
    // This config is here for backwards compatibility and can eventually be removed
    const config = await resolveFrontendConfig(services.environmentConfig.frontendConfig, services.environmentConfig.codeVersion);

    return apiJsonResponse(200, {
      code: await resolveConfigValue(services.environmentConfig.codeVersion),
      config: config,
    });
  }
);

/*
 * used in dev when vite serves index.html directly.
 * deployed, buildIndex has already written this into the
 * document and the frontend never calls this route.
 */
export const apiV0SessionConfig = createRoute({name: 'apiV0SessionConfig', method: METHOD.GET,
  path: '/api/v0/session-config',
  requestServiceProvider},
  async(_params: undefined, _services) => apiJsonResponse(200, resolveSessionConfig())
);

// gtm reads the consent preferences from here
const oxUserData = (user: ApiUser) => JSON.stringify({
  consentPreferences: user.consent_preferences,
  uuid: user.uuid,
});

/*
 * if for whatever reason the app needs a different session config structure
 * in different contexts, you must use a different global name for each one,
 * so that they can be strongly typed.
 */
type InjectedSessionConfig =
  | {global: '_OX_SESSION_CONFIG'; value: SessionConfig};

export const buildFrontendIndexBody = async(services: {
  environmentConfig: EnvironmentConfigProvider;
  frontendFileServer: FileServerAdapter;
  request: ApiRouteRequest;
}, sessionConfig: InjectedSessionConfig) => {
  const frontendConfig = await resolveFrontendConfig(
    services.environmentConfig.frontendConfig,
    services.environmentConfig.codeVersion
  );
  const maintenanceMessage = await resolveConfigValue(services.environmentConfig.maintenanceMessage);

  const bodyFile = maintenanceMessage ? 'build/maintenance.html' : 'build/index.html';
  let body = await getHtmlFileContent(services, bodyFile);

  body = body.replace(
    '<head>',
    `<head>
      <script>window._OX_FRONTEND_CONFIG = ${JSON.stringify(frontendConfig)};</script>`
  );

  if (maintenanceMessage) {
    body = body.replace('<body>', `<body>${maintenanceMessage}`);
  }

  // Add os-subcontent body class if subcontent queryStringParameter is set to true
  if (services.request.queryStringParameters?.subcontent === 'true') {
    body = body.replace('<body>', '<body class="os-subcontent">');
  }

  return body.replace(
    '<head>',
    `<head>
      <script>window.${sessionConfig.global} = ${JSON.stringify(sessionConfig.value)};</script>`
  );
};

export const buildIndex = createRoute({name: 'buildIndex', method: METHOD.GET, path: '/build/index.html',
  requestServiceProvider: composeServiceMiddleware(
    requestServiceProvider,
    frontendFileServerMiddleware,
  )},
  async(_params: undefined, services) => {
    const token = await services.authProvider.getAuthToken();
    const user = await services.authProvider.loadUserData();

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
        <script>
          window._OX_AUTH_TOKEN = '${token}';
          window._OX_USER_DATA = ${oxUserData(user, user.consent_preferences)};
        </script>`
    ): bodyWithSubcontent;

    return apiHtmlResponse(200, body, { 'cache-control': 'no-cache' });
  }
);

export const apiV0Routes = () => routesList([
  apiV0Index,
  buildIndex,
  ...apiV0OrnRoutes(),
]);

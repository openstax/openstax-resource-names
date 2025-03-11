import { getKeyValue } from '@openstax/ts-utils';
import { stubAuthProvider, User } from '@openstax/ts-utils/services/authProvider';
import { createConsoleLogger } from '@openstax/ts-utils/services/logger/console';
import { ApiRouteRequest, AppServices } from '../../core';
import { apiV0Index, apiV0Routes, buildIndex, makeIndexHtmlBody } from '.';

let appServices: AppServices;
let request: ApiRouteRequest;

beforeEach(async () => {
  appServices = {} as AppServices;
  request = {} as ApiRouteRequest;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('apiV0Index', () => {
  it('matches snapshot', async() => {
    const requestServices = {
      logger: createConsoleLogger(),
      request,
      environmentConfig: {
        codeVersion: 'code-version-goes-here',
        apiHost: '',
        uiHost: '',
        maintenanceMessage: '',
        frontendConfig: {
          roleApplication: 'test',
          accountsBase: 'https://dev.openstax.org/accounts',
        },
      },
      authProvider: stubAuthProvider()
    };
    const response = await apiV0Index.handler(undefined, requestServices);
    expect(response).toMatchInlineSnapshot(`
{
  "body": "{"code":"code-version-goes-here","config":{"roleApplication":"test","accountsBase":"https://dev.openstax.org/accounts"}}",
  "data": {
    "code": "code-version-goes-here",
    "config": {
      "accountsBase": "https://dev.openstax.org/accounts",
      "roleApplication": "test",
    },
  },
  "headers": {
    "content-type": "application/json",
  },
  "statusCode": 200,
}
`);
  });

  it('matches snapshot with user', async() => {
    const requestServices = {
      logger: createConsoleLogger(),
      request,
      environmentConfig: {
        codeVersion: 'code-version-goes-here',
        apiHost: '',
        uiHost: '',
        maintenanceMessage: '',
        frontendConfig: {
          roleApplication: 'test',
          accountsBase: 'https://dev.openstax.org/accounts',
        },
      },
      authProvider: stubAuthProvider({name: 'test user'} as User)
    };
    appServices.getEnvironmentConfig = getKeyValue('deployed');
    const response = await apiV0Index.handler(undefined, requestServices);
    expect(response).toMatchInlineSnapshot(`
{
  "body": "{"code":"code-version-goes-here","config":{"roleApplication":"test","accountsBase":"https://dev.openstax.org/accounts"}}",
  "data": {
    "code": "code-version-goes-here",
    "config": {
      "accountsBase": "https://dev.openstax.org/accounts",
      "roleApplication": "test",
    },
  },
  "headers": {
    "content-type": "application/json",
  },
  "statusCode": 200,
}
`);
  });
});

describe('buildIndex', () => {
  it('matches snapshot without user', async() => {
    const requestServices = {
      authProvider: stubAuthProvider(),
      environmentConfig: {
        codeVersion: 'code-version-goes-here',
        apiHost: '',
        uiHost: '',
        maintenanceMessage: '',
        frontendConfig: {
          roleApplication: 'test',
          accountsBase: 'https://dev.openstax.org/accounts',
        },
      },
      frontendFileServer: { getFileContent: async() => Buffer.from(
        '<html><head><!-- Static head stuff --></head><body><!-- Static body stuff --></body></html>'
      ) },
      logger: createConsoleLogger(),
      request,
    };
    const response = await buildIndex.handler(undefined, requestServices);
    expect(response).toMatchInlineSnapshot(`
{
  "body": "<html><head>
      <script>window._OX_FRONTEND_CONFIG = {"roleApplication":"test","accountsBase":"https://dev.openstax.org/accounts"};</script><!-- Static head stuff --></head><body><!-- Static body stuff --></body></html>",
  "data": "<html><head>
      <script>window._OX_FRONTEND_CONFIG = {"roleApplication":"test","accountsBase":"https://dev.openstax.org/accounts"};</script><!-- Static head stuff --></head><body><!-- Static body stuff --></body></html>",
  "headers": {
    "cache-control": "no-cache",
    "content-type": "text/html",
  },
  "statusCode": 200,
}
`);
  });

  it('matches snapshot with user', async() => {
    const requestServices = {
      authProvider: stubAuthProvider({
        name: 'test user', consent_preferences: { accepted: ['test'], rejected: ['nothing'] },
      } as User),
      environmentConfig: {
        codeVersion: 'code-version-goes-here',
        apiHost: '',
        uiHost: '',
        maintenanceMessage: '',
        frontendConfig: {
          roleApplication: 'test',
          accountsBase: 'https://dev.openstax.org/accounts',
        },
      },
      frontendFileServer: { getFileContent: async() => Buffer.from(
        '<html><head><!-- Static head stuff --></head><body><!-- Static body stuff --></body></html>'
      ) },
      logger: createConsoleLogger(),
      request,
    };
    const response = await buildIndex.handler(undefined, requestServices);
    expect(response).toMatchInlineSnapshot(`
{
  "body": "<html><head>
        <script>window._OX_USER_DATA = {"name":"test user","consent_preferences":{"accepted":["test"],"rejected":["nothing"]}};</script>
      <script>window._OX_FRONTEND_CONFIG = {"roleApplication":"test","accountsBase":"https://dev.openstax.org/accounts"};</script><!-- Static head stuff --></head><body><!-- Static body stuff --></body></html>",
  "data": "<html><head>
        <script>window._OX_USER_DATA = {"name":"test user","consent_preferences":{"accepted":["test"],"rejected":["nothing"]}};</script>
      <script>window._OX_FRONTEND_CONFIG = {"roleApplication":"test","accountsBase":"https://dev.openstax.org/accounts"};</script><!-- Static head stuff --></head><body><!-- Static body stuff --></body></html>",
  "headers": {
    "cache-control": "no-cache",
    "content-type": "text/html",
  },
  "statusCode": 200,
}
`);
  });

  it('matches snapshot with subcontent queryStringParameter', async() => {
    const requestServices = {
      authProvider: stubAuthProvider(),
      environmentConfig: {
        codeVersion: 'code-version-goes-here',
        apiHost: '',
        uiHost: '',
        maintenanceMessage: '',
        frontendConfig: {
          roleApplication: 'test',
          accountsBase: 'https://dev.openstax.org/accounts',
        },
      },
      frontendFileServer: { getFileContent: async() => Buffer.from(
        '<html><head><!-- Static head stuff --></head><body><!-- Static body stuff --></body></html>'
      ) },
      logger: createConsoleLogger(),
      request: { queryStringParameters: { subcontent: 'true' } } as unknown as ApiRouteRequest,
    };
    const response = await buildIndex.handler(undefined, requestServices);
    expect(response).toMatchInlineSnapshot(`
{
  "body": "<html><head>
      <script>window._OX_FRONTEND_CONFIG = {"roleApplication":"test","accountsBase":"https://dev.openstax.org/accounts"};</script><!-- Static head stuff --></head><body class="os-subcontent"><!-- Static body stuff --></body></html>",
  "data": "<html><head>
      <script>window._OX_FRONTEND_CONFIG = {"roleApplication":"test","accountsBase":"https://dev.openstax.org/accounts"};</script><!-- Static head stuff --></head><body class="os-subcontent"><!-- Static body stuff --></body></html>",
  "headers": {
    "cache-control": "no-cache",
    "content-type": "text/html",
  },
  "statusCode": 200,
}
`);
  });
});

describe('makeIndexHtmlBody', () => {
  it('matches snapshot with maintenance message', async () => {
    const response = await makeIndexHtmlBody({
      getFileContent: async () => Buffer.from(
        '<html><head><!-- Static head stuff --></head><body><!-- Static body stuff --></body></html>'
      )
    }, {
      codeVersion: 'code-version-goes-here',
      maintenanceMessage: 'Down for maintenance',
      frontendConfig: {
        roleApplication: 'test',
        accountsBase: 'https://dev.openstax.org/accounts',
      }
    }
    );
    expect(response).toMatchInlineSnapshot(`
"<html><head>
      <script>window._OX_FRONTEND_CONFIG = {"roleApplication":"test","accountsBase":"https://dev.openstax.org/accounts"};</script><!-- Static head stuff --></head><body>Down for maintenance<!-- Static body stuff --></body></html>"
`);
  });
});

describe('apiV0Routes', () => {
  it('collects routes', () => {
    expect(() => apiV0Routes()).not.toThrow();
  });
});

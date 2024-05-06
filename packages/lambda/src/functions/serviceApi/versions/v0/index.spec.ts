import { getKeyValue } from '@openstax/ts-utils';
import { stubAuthProvider, User } from '@openstax/ts-utils/services/authProvider';
import { createConsoleLogger } from '@openstax/ts-utils/services/logger/console';
import { ApiRouteRequest, AppServices } from '../../core';
import { apiV0Index, apiV0Routes } from '.';

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

describe('apiV0Routes', () => {
  it('collects routes', () => {
    expect(() => apiV0Routes()).not.toThrow();
  });
});

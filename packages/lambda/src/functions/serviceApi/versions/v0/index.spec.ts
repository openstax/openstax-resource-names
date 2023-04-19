import { getKeyValue } from '@openstax/ts-utils';
import { createProfile } from '@openstax/ts-utils/profile';
import { stubAuthProvider, User } from '@openstax/ts-utils/services/authProvider';
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
      profile: createProfile('').start(),
      request,
      environmentConfig: {
        codeVersion: 'code-version-goes-here',
        apiHost: '',
        uiHost: '',
        frontendConfig: {
          REACT_APP_CONFIG_EXAMPLE_MESSAGE: 'hello from /api/v0/info',
        },
      },
      authProvider: stubAuthProvider()
    };
    const response = await apiV0Index.handler(undefined, requestServices);
    expect(response).toMatchInlineSnapshot(`
{
  "body": "{"message":"greetings from the api controller","code":"code-version-goes-here","config":{"REACT_APP_CONFIG_EXAMPLE_MESSAGE":"hello from /api/v0/info"}}",
  "data": {
    "code": "code-version-goes-here",
    "config": {
      "REACT_APP_CONFIG_EXAMPLE_MESSAGE": "hello from /api/v0/info",
    },
    "message": "greetings from the api controller",
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
      profile: createProfile('').start(),
      request,
      environmentConfig: {
        codeVersion: 'code-version-goes-here',
        apiHost: '',
        uiHost: '',
        frontendConfig: {
          REACT_APP_CONFIG_EXAMPLE_MESSAGE: 'hello from /api/v0/info',
        },
      },
      authProvider: stubAuthProvider({name: 'test user'} as User)
    };
    appServices.getEnvironmentConfig = getKeyValue('deployed');
    const response = await apiV0Index.handler(undefined, requestServices);
    expect(response).toMatchInlineSnapshot(`
{
  "body": "{"message":"greetings from the api controller test user","code":"code-version-goes-here","config":{"REACT_APP_CONFIG_EXAMPLE_MESSAGE":"hello from /api/v0/info"}}",
  "data": {
    "code": "code-version-goes-here",
    "config": {
      "REACT_APP_CONFIG_EXAMPLE_MESSAGE": "hello from /api/v0/info",
    },
    "message": "greetings from the api controller test user",
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

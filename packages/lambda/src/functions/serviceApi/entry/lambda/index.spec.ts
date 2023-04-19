import { APIGatewayProxyEventV2 } from 'aws-lambda/trigger/api-gateway-proxy';
import * as coreModule from '../../core';
import { handler } from '.';

jest.mock('../../core', () => {
  const getRequestResponse = jest.fn();
  return {
    getRequestResponse,
    getRequestResponder: jest.fn(() => getRequestResponse)
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('handler', () => {
  let getRequestResponseSpy: jest.SpyInstance;
  let mockResponse: coreModule.ApiRouteResponse | undefined;

  beforeEach(async() => {
    mockResponse = {body: 'foobar body', statusCode: 200, data: 'foobar body'};
    getRequestResponseSpy = (coreModule as any).getRequestResponse.mockImplementation(() => Promise.resolve(mockResponse));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns response', async() => {
    const request = {
      cookies: [],
      headers: { },
      requestContext: {
        http: {
          method: 'GET'
        }
      }
    } as unknown as APIGatewayProxyEventV2;
    const response = await handler(request);

    expect(getRequestResponseSpy).toHaveBeenCalledWith(request);
    expect(response.body).toBe('foobar body');
  });
});

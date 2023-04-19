import { createProfile } from '@openstax/ts-utils/profile';
import { stubAuthProvider } from '@openstax/ts-utils/services/authProvider';
import nock from 'nock';
import { ApiRouteRequest } from '../../../core';
import { apiV0ExampleError, apiV0ExampleReverseRouting, apiV0GetExampleDoc, apiV0GetExampleDocHistory, apiV0SearchExampleDoc, apiV0SubRequest, apiV0WriteExampleDoc, validateExampleDocPayload } from './routes';

let request: ApiRouteRequest;

beforeEach(async () => {
  request = {} as ApiRouteRequest;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('apiV0ExampleReverseRouting', () => {
  it('matches snapshot', async() => {
    const response = await apiV0ExampleReverseRouting.handler(undefined, {request} as any);
    expect(response).toMatchInlineSnapshot(`
{
  "body": "{"links":{"apiV0GetExampleDoc":"/api/v0/get-example-document/foo","apiV0WriteExampleDoc":"/api/v0/write-example-document/bar"}}",
  "data": {
    "links": {
      "apiV0GetExampleDoc": "/api/v0/get-example-document/foo",
      "apiV0WriteExampleDoc": "/api/v0/write-example-document/bar",
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

describe('apiV0SearchExampleDoc', () => {
  it('searches', async() => {
    const search = jest.fn();
    const requestServices = {
      pagination: {
        getPaginationParams: () => ({}),
        getPaginationResponse: (x: any) => x,
      },
      exampleDocumentSearch: {search},
      request: {
        queryStringParameters: {
          query: 'cool query',
          someFilter: 'filter value'
        }
      }
    } as any;
    search.mockReturnValue([{result: 'value'}]);
    const result = await apiV0SearchExampleDoc.handler(undefined, requestServices);

    expect(search).toHaveBeenCalledWith(expect.objectContaining({
      query: 'cool query',
      filter: [{key: 'someFilter', value: ['filter value']}]
    }));
    expect(result).toMatchInlineSnapshot(`
{
  "body": "[{"result":"value"}]",
  "data": [
    {
      "result": "value",
    },
  ],
  "headers": {
    "content-type": "application/json",
  },
  "statusCode": 200,
}
`);
  });

  it('works with no query', async() => {
    const search = jest.fn();
    const requestServices = {
      pagination: {
        getPaginationParams: () => ({}),
        getPaginationResponse: (x: any) => x,
      },
      exampleDocumentSearch: {search},
      request: {
      }
    } as any;
    search.mockReturnValue([{result: 'value'}]);
    const result = await apiV0SearchExampleDoc.handler(undefined, requestServices);

    expect(search).toHaveBeenCalledWith(expect.objectContaining({
      query: undefined,
      filter: []
    }));
    expect(result).toMatchInlineSnapshot(`
{
  "body": "[{"result":"value"}]",
  "data": [
    {
      "result": "value",
    },
  ],
  "headers": {
    "content-type": "application/json",
  },
  "statusCode": 200,
}
`);
  });

  it('omits empty filters', async() => {
    const search = jest.fn();
    const requestServices = {
      pagination: {
        getPaginationParams: () => ({}),
        getPaginationResponse: (x: any) => x,
      },
      exampleDocumentSearch: {search},
      request: {
        queryStringParameters: {
          query: 'cool query',
          someFilter: ''
        }
      }
    } as any;
    search.mockReturnValue([{result: 'value'}]);
    const result = await apiV0SearchExampleDoc.handler(undefined, requestServices);

    expect(search).toHaveBeenCalledWith(expect.objectContaining({
      query: 'cool query',
      filter: []
    }));
    expect(result).toMatchInlineSnapshot(`
{
  "body": "[{"result":"value"}]",
  "data": [
    {
      "result": "value",
    },
  ],
  "headers": {
    "content-type": "application/json",
  },
  "statusCode": 200,
}
`);
  });
});

describe('apiV0GetExampleDocHistory', () => {
  it('gets versions', async() => {
    const getVersions = jest.fn();
    const requestServices = {
      pagination: {
        getPageTokenNumber: () => 1111,
        getPaginationResponse: (x: any) => x,
      },
      exampleDocumentStore: {getVersions}
    } as any;
    getVersions.mockReturnValue([{foo: 'bar'}]);
    const result = await apiV0GetExampleDocHistory.handler({key: 'example-id'}, requestServices);

    expect(getVersions).toHaveBeenCalledWith('example-id', 1111);
    expect(result).toMatchInlineSnapshot(`
{
  "body": "[{"foo":"bar"}]",
  "data": [
    {
      "foo": "bar",
    },
  ],
  "headers": {
    "content-type": "application/json",
  },
  "statusCode": 200,
}
`);
  });

  it('returns 404 for missing item', async() => {
    const getVersions = jest.fn();
    const requestServices = {
      pagination: {
        getPageTokenNumber: () => 1111,
        getPaginationResponse: (x: any) => x,
      },
      exampleDocumentStore: {getVersions}
    } as any;
    getVersions.mockReturnValue(undefined);
    const result = await apiV0GetExampleDocHistory.handler({key: 'example-id'}, requestServices);

    expect(getVersions).toHaveBeenCalledWith('example-id', 1111);
    expect(result).toMatchInlineSnapshot(`
{
  "body": "{"message":"requested item not found"}",
  "data": {
    "message": "requested item not found",
  },
  "headers": {
    "content-type": "application/json",
  },
  "statusCode": 404,
}
`);
  });
});

describe('apiV0GetExampleDoc', () => {
  it('returns result from document store', async() => {
    const getItem = jest.fn();
    const requestServices = {
      exampleDocumentStore: {getItem}
    } as any;
    getItem.mockReturnValue({foo: 'bar'});
    const result = await apiV0GetExampleDoc.handler({key: 'example-id'}, requestServices);

    expect(getItem).toHaveBeenCalledWith('example-id');
    expect(result).toMatchInlineSnapshot(`
{
  "body": "{"foo":"bar"}",
  "data": {
    "foo": "bar",
  },
  "headers": {
    "content-type": "application/json",
  },
  "statusCode": 200,
}
`);
  });

  it('returns 404 for missing item', async() => {
    const getItem = jest.fn();
    const requestServices = {
      exampleDocumentStore: {getItem}
    } as any;
    getItem.mockReturnValue(undefined);
    const result = await apiV0GetExampleDoc.handler({key: 'example-id'}, requestServices);

    expect(getItem).toHaveBeenCalledWith('example-id');
    expect(result).toMatchInlineSnapshot(`
{
  "body": "{"message":"requested item not found"}",
  "data": {
    "message": "requested item not found",
  },
  "headers": {
    "content-type": "application/json",
  },
  "statusCode": 404,
}
`);
  });
});

describe('apiV0WriteExampleDoc', () => {
  it('saves item', async() => {
    const item = {asdf: 'foo'};
    const putItem = jest.fn();
    const requestServices = {
      request,
      exampleDocumentStore: {putItem},
      payload: item
    } as any;
    putItem.mockReturnValue(Promise.resolve({...item, id: 'example-id'}));
    const result = await apiV0WriteExampleDoc.handler({key: 'example-id'}, requestServices);

    expect(putItem).toHaveBeenCalledWith({...item, id: 'example-id'});

    expect(result).toMatchInlineSnapshot(`
{
  "body": "{"asdf":"foo","id":"example-id"}",
  "data": {
    "asdf": "foo",
    "id": "example-id",
  },
  "headers": {
    "content-type": "application/json",
  },
  "statusCode": 201,
}
`);
  });

  describe('validator', () => {
    it('fails for non-objects', () => {
      expect(validateExampleDocPayload([])).toBe(false);
    });

    it('fails for empty object', () => {
      expect(validateExampleDocPayload({})).toBe(false);
    });

    it('fails with missing param', () => {
      expect(validateExampleDocPayload({name: 'string'})).toBe(false);
    });

    it('fails with extra param', () => {
      expect(validateExampleDocPayload({name: 'string', description: 'description', extra: 'string'})).toBe(false);
    });

    it('fails with wrong type', () => {
      expect(validateExampleDocPayload({name: 4, description: 'description'})).toBe(false);
    });

    it('passes', () => {
      expect(validateExampleDocPayload({name: 'string', description: 'description'})).toBe(true);
    });
  });
});

describe('apiV0ExampleError', () => {
  it('saves item', async() => {
    const requestServices = {} as any;
    await expect(apiV0ExampleError.handler(undefined, requestServices)).rejects.toThrow();
  });
});

describe('apiV0SubRequest', () => {
  it('sub-requests', async() => {
    const services = {
      request: {} as ApiRouteRequest,
      environmentConfig: {apiHost: 'https://apiHost', uiHost: 'https://uiHost'},
      authProvider: stubAuthProvider(undefined),
      profile: createProfile('').start(),
    };

    nock('https://apiHost').get('/api/v0/info').reply(200, {message: 'cool message'});

    const response = await apiV0SubRequest.handler(undefined, services);
    expect(response).toMatchInlineSnapshot(`
{
  "body": "{"message":"cool message"}",
  "data": {
    "message": "cool message",
  },
  "headers": {
    "content-type": "application/json",
  },
  "statusCode": 200,
}
`);
  });
});

// spell-checker: ignore Orns
import * as ornResolveImport from '@openstax/orn-locator/resolve';
import { apiV0GoToOrn, apiV0LookupOrn, apiV0LookupOrns } from './ornRoutes';

const ornResolve: any = ornResolveImport;
jest.mock('@openstax/orn-locator/resolve');

let services: any;

beforeEach(() => {
  services = { request: {} };
});

describe('apiV0GoToOrn', () => {
  it('goes', async() => {
    ornResolve.locate.mockReturnValue(Promise.resolve({
      urls: {main: 'some url'}
    }));
    const response = await apiV0GoToOrn.handler({tail: 'foo/bar'}, services);
    expect(response).toMatchInlineSnapshot(`
{
  "body": "redirecting...",
  "data": "redirecting...",
  "headers": {
    "content-type": "text/plain",
    "location": "some url",
  },
  "statusCode": 302,
}
`);
  });

  it('works with skipCache', async() => {
    ornResolve.locate.mockReturnValue(Promise.resolve({
      urls: {main: 'some url'}
    }));
    services.request.queryStringParameters = { skipCache: 'true' };
    const response = await apiV0GoToOrn.handler({tail: 'foo/bar'}, services);
    expect(response).toMatchInlineSnapshot(`
{
  "body": "redirecting...",
  "data": "redirecting...",
  "headers": {
    "content-type": "text/plain",
    "location": "some url",
  },
  "statusCode": 302,
}
`);
  });

  it('errors', async() => {
    ornResolve.locate.mockReturnValue(Promise.resolve({}));
    const response = await apiV0GoToOrn.handler({tail: 'foo/bar'}, services);
    expect(response).toMatchInlineSnapshot(`
{
  "body": "this resource doesn't seem to be visitable",
  "data": "this resource doesn't seem to be visitable",
  "headers": {
    "content-type": "text/plain",
  },
  "statusCode": 400,
}
`);
  });
});

describe('apiV0LookupOrn', () => {
  it('looks up', async() => {
    ornResolve.locate.mockReturnValue(Promise.resolve({
      some: 'very cool data'
    }));
    const response = await apiV0LookupOrn.handler({tail: 'foo/bar'}, services);
    expect(response).toMatchInlineSnapshot(`
{
  "body": "{"some":"very cool data"}",
  "data": {
    "some": "very cool data",
  },
  "headers": {
    "content-type": "application/json",
  },
  "statusCode": 200,
}
`);
  });

  it('works with skipCache', async() => {
    ornResolve.locate.mockReturnValue(Promise.resolve({
      some: 'very cool data'
    }));
    services.request.queryStringParameters = { skipCache: 'true' };
    const response = await apiV0LookupOrn.handler({tail: 'foo/bar'}, services);
    expect(response).toMatchInlineSnapshot(`
{
  "body": "{"some":"very cool data"}",
  "data": {
    "some": "very cool data",
  },
  "headers": {
    "content-type": "application/json",
  },
  "statusCode": 200,
}
`);
  });
});

describe('apiV0LookupOrns', () => {
  it('looks up', async() => {
    ornResolve.locateAll.mockReturnValue(Promise.resolve([
      {cool: 'result number one'},
      {cool: 'result number two'}
    ]));
    const searchClient: any = {};
    services.request.queryStringParameters = {
      orn: 'https://orn.openstax.org/orn/foo/bar,https://orn.openstax.org/orn/bar/baz'
    };
    services.searchClient = searchClient;
    const response = await apiV0LookupOrns.handler(undefined, services);

    expect(ornResolve.locateAll).toHaveBeenCalledWith(
      {concurrency: 10, searchClient, skipCache: false},
      ['https://orn.openstax.org/orn/foo/bar','https://orn.openstax.org/orn/bar/baz'],
    );
    expect(response).toMatchInlineSnapshot(`
{
  "body": "{"items":[{"cool":"result number one"},{"cool":"result number two"}]}",
  "data": {
    "items": [
      {
        "cool": "result number one",
      },
      {
        "cool": "result number two",
      },
    ],
  },
  "headers": {
    "content-type": "application/json",
  },
  "statusCode": 200,
}
`);
  });

  it('throws without parameter', async() => {
    await expect(() => apiV0LookupOrns.handler(undefined, services)).rejects.toThrowErrorMatchingInlineSnapshot('"an orn query parameter is required"');
  });
});

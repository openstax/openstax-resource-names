import { METHOD } from '@openstax/ts-utils/routing';
import { logExtractor, pathExtractor, routeMatcher } from './request';
import { ApiRouteRequest } from './types';

describe('logExtractor', () => {
  it('extracts path and queryStringParameters from request', () => {
    expect(logExtractor(
      { queryStringParameters: {}, requestContext: { http: { path: '/asdf/foo' } } } as unknown as ApiRouteRequest
    )).toEqual({http: { path: '/asdf/foo' }, query: {}, requestId: undefined });
  });

  it('extracts path and headers from request', () => {
    expect(logExtractor(
      { queryStringParameters: {}, requestContext: { http: { path: '/asdf/foo' } }, headers: { 'x-request-id': 'test-id' } } as unknown as ApiRouteRequest
    )).toEqual({http: { path: '/asdf/foo' }, query: {}, requestId: 'test-id'});
  });

  it('extracts path and headers is empty from request', () => {
    expect(logExtractor(
      { queryStringParameters: {}, requestContext: { http: { path: '/asdf/foo' } }, headers: {} } as unknown as ApiRouteRequest
    )).toEqual({http: { path: '/asdf/foo' }, query: {}, requestId: undefined});
  });
});

describe('pathExtractor', () => {
  it('extracts path from request', () => {
    expect(pathExtractor({requestContext: {http: {path: '/asdf/foo'}}} as ApiRouteRequest)).toBe('/asdf/foo');
  });
});

describe('routeMatcher', () => {
  it('positive matches', () => {
    expect(routeMatcher({requestContext: {http: {method: 'GET'}}} as ApiRouteRequest, {method: METHOD.GET})).toBe(true);
  });
  it('negative matches', () => {
    expect(routeMatcher({requestContext: {http: {method: 'GET'}}} as ApiRouteRequest, {method: METHOD.POST})).toBe(false);
  });
});

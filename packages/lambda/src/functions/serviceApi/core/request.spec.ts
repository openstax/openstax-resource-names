import { METHOD } from '@openstax/ts-utils/routing';
import { logExtractor, pathExtractor, routeMatcher } from './request';
import { ApiRouteRequest } from './types';

describe('logExtractor', () => {
  it('extracts path from request', () => {
    expect(logExtractor({requestContext: {http: {path: '/asdf/foo'}}} as ApiRouteRequest)).toEqual({path: '/asdf/foo'});
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

import { locate, locateAll, search } from '@openstax/orn-locator/resolve';
import { assertDefined, assertNotNaN, assertString } from '@openstax/ts-utils/assertions';
import { InvalidRequestError } from '@openstax/ts-utils/errors';
import { apiJsonResponse, apiTextResponse, METHOD } from '@openstax/ts-utils/routing';
import { composeServiceMiddleware, createRoute } from '../../../core/services';
import { enableTracingMiddleware } from '../middleware/enableTracingMiddleware';

const requestServiceProvider = composeServiceMiddleware(
  enableTracingMiddleware,
);

export const apiV0LookupOrns = createRoute({name: 'apiV0LookupOrns', method: METHOD.GET, path: '/api/v0/orn-lookup',
  requestServiceProvider},
  async(_params: undefined, services) => {
    const orns = assertDefined(
      services.request.queryStringParameters?.orn,
      new InvalidRequestError('an orn query parameter is required')
    ).split(',');

    const items = await locateAll(orns);

    return apiJsonResponse(200, {
      items
    });
  }
);

export const apiV0Search = createRoute({name: 'apiV0Search', method: METHOD.GET, path: '/api/v0/search',
  requestServiceProvider},
  async(_params: undefined, services) => {
    const {query: rawQuery, limit: rawLimit, ...rawFilters} = services.request.queryStringParameters || {};

    const query = assertDefined(rawQuery, new InvalidRequestError('an query string is required'));

    const limit = rawLimit !== undefined
      ? assertNotNaN(parseInt(rawLimit, 10), new InvalidRequestError('limit must be numeric'))
      : undefined;

    const filters = Object.fromEntries(Object.entries(rawFilters).map(([key, value]) => [key,
      typeof value === 'string' && value.indexOf(',') > -1 ? value.split(',') : assertString(value, new InvalidRequestError('filters must be strings'))
    ]));

    const data = await search(query, limit, filters);
    return apiJsonResponse(200, data);
  }
);

export const apiV0LookupOrn = createRoute({name: 'apiV0LookupOrn', method: METHOD.GET, path: '/orn/:tail(.*?).json',
  requestServiceProvider},
  async({tail}: {tail: string}) => {
    const orn = `https://openstax.org/orn/${tail}`;
    const data = await locate(orn);
    return apiJsonResponse(200, data);
  }
);

export const apiV0GoToOrn = createRoute({name: 'apiV0GoToOrn', method: METHOD.GET, path: '/orn/:tail(.*?)',
  requestServiceProvider},
  async({tail}: {tail: string}) => {
    const orn = `https://openstax.org/orn/${tail}`;
    const data = await locate(orn);

    if (!('urls' in data)) {
      return apiTextResponse(400, 'this resource doesn\'t seem to be visitable');
    }

    return apiTextResponse(302, 'redirecting...', {location: data.urls.main});
  }
);

export const apiV0OrnRoutes = () => ([
  apiV0LookupOrn,
  apiV0Search,
  apiV0GoToOrn,
  apiV0LookupOrns,
]);

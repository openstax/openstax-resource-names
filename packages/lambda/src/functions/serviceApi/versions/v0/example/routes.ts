import { envConfig, replaceConfig, resolveConfigValue } from '@openstax/ts-utils/config';
import { isDefined, isPlainObject } from '@openstax/ts-utils/guards';
import { apiJsonResponse, ApiResponse, JsonCompatibleStruct, METHOD, requestPayloadProvider } from '@openstax/ts-utils/routing';
import fetch from 'node-fetch';
import { apiV0Index } from '..';
import { renderRouteUrl } from '../../../core/routes';
import { composeServiceMiddleware, createRoute } from '../../../core/services';
import { authMiddleware } from '../middleware/authMiddleware';
import { getEnvironmentConfig } from '../middleware/configMiddleware';
import { enableTracingMiddleware } from '../middleware/enableTracingMiddleware';
import { loadMorePaginationMiddleware, pageNumberPaginationMiddleware } from '../middleware/paginationMiddleware';
import { documentSearchMiddleware } from './documentSearchMiddleware';
import { documentStoreMiddleware, ExampleDocument } from './documentStoreMiddleware';

// shared middleware can be gathered separately like this
const requestServiceProvider = composeServiceMiddleware(
  authMiddleware,
  documentStoreMiddleware,
  documentSearchMiddleware,
);

export const apiV0ExampleError = createRoute({name: 'apiV0ExampleError', method: METHOD.GET, path: '/api/v0/example-error',
  requestServiceProvider, // if you don't need any other middleware just pass it through
  handler: async() => {
    throw new Error('cool message');
  }
});

export const apiV0ExampleReverseRouting = createRoute({name: 'apiV0ExampleReverseRouting', method: METHOD.GET, path: '/api/v0/example',
  requestServiceProvider,
  /*
   * you can provide an explicit response type like this, or let typescript figure it out from the return statements,
   * in either case the apiGateway helper will pull this response type through to the client code.
   */
  handler: async(): Promise<ApiResponse<200, {links: {[key: string]: string}}>> => {
    return apiJsonResponse(200, {
      links: {
        [apiV0GetExampleDoc.name]: renderRouteUrl(apiV0GetExampleDoc, {key: 'foo'}),
        [apiV0WriteExampleDoc.name]: renderRouteUrl(apiV0WriteExampleDoc, {key: 'bar'}),
      }
    });
  }
});

/*
 * loading version history of a document is an example of "load more" style pagination, this is necessary
 * because of the way dynamodb does its pagination
 */
export const apiV0GetExampleDocHistory = createRoute({name: 'apiV0GetExampleDocHistory', method: METHOD.GET, path: '/api/v0/get-example-document/:key/history',
  requestServiceProvider: composeServiceMiddleware( // more middleware can be composed in the same way
    requestServiceProvider,
    loadMorePaginationMiddleware,
  )},
  /*
   * if you specify the requestServiceProvider inline, like the previous line, then TS has trouble figuring out the types if
   * the handler is part of the same argument, so in this case you need to specify the handler in the second argument
   */
  async(params: {key: string}, services) => {
    const result = await services.exampleDocumentStore.getVersions(params.key, services.pagination.getPageTokenNumber());

    /*
     * if a route returns more than one response format, the apiGateway will help clients keep track of that
     * and provides a narrowing helper based on the status code (the client can also just throw on unexpected statuses)
     */
    if (!result) {
      return apiJsonResponse(404, { message: 'requested item not found' });
    }

    return apiJsonResponse(200, services.pagination.getPaginationResponse(result));
  }
);

export const apiV0GetExampleDoc = createRoute({name: 'apiV0GetExampleDoc', method: METHOD.GET, path: '/api/v0/get-example-document/:key',
  requestServiceProvider,
  handler: async(params: {key: string}, services) => {
    const result = await services.exampleDocumentStore.getItem(params.key);

    if (!result) {
      return apiJsonResponse(404, { message: 'requested item not found' });
    }

    return apiJsonResponse(200, result);
  }
});

/*
 * document search is an example of "page number" style pagination, this is necessary
 * because of the way elastic search does its pagination
 */
export const apiV0SearchExampleDoc = createRoute({name: 'apiV0SearchExampleDoc', method: METHOD.GET, path: '/api/v0/search-example-document',
  requestServiceProvider: composeServiceMiddleware(
    requestServiceProvider,
    pageNumberPaginationMiddleware,
  )},
  async(_: undefined, services) => {
    const queryParams = services.request.queryStringParameters || {};
    const {query, ...filters} = queryParams;

    const result = await services.exampleDocumentSearch.search({
      ...services.pagination.getPaginationParams(),
      query,
      filter: Object.entries(filters).map(([key, value]) => key && value
        ? {key, value: value.split(',')}
        : undefined
      ).filter(isDefined),
      fields: [
        {key: 'name', weight: 5},
        {key: 'description', weight: 1}
      ]
    });

    return apiJsonResponse(200,
      services.pagination.getPaginationResponse(result)
    );
  }
);

/*
 * these payload validators are essentially guards, you can make them generate more useful error messages
 * by using the `assertTrue` helper from the utils module with a fail case throwing InvalidRequestError
 */
export const validateExampleDocPayload = (input: {[key: string]: any}): input is Omit<ExampleDocument, 'author' | 'timestamp' | 'id'> =>
  isPlainObject(input)
    && Object.keys(input).length === 2
    && typeof input.name === 'string'
    && typeof input.description === 'string'
;

export const apiV0WriteExampleDoc = createRoute({name: 'apiV0WriteExampleDoc', method: METHOD.POST, path: '/api/v0/write-example-document/:key',
  requestServiceProvider: composeServiceMiddleware(
    requestServiceProvider,
    /*
     * the presence of this requestPayloadProvider and the type provided by the validator/guard you pass into it is what
     * allows the apiGateway to provide a strong payload type
     */
    requestPayloadProvider(validateExampleDocPayload)
  )},
  async(params: {key: string}, services) => {
    const result = await services.exampleDocumentStore.putItem({
      ...services.payload,
      id: params.key,
    });
    return apiJsonResponse(201, result);
  }
);

/*
 * example sub-requesting to another route to test profile tracing
 */
export const apiV0SubRequest = createRoute({name: 'apiV0SubRequest', method: METHOD.GET, path: '/api/v0/test-subrequest',
  requestServiceProvider: composeServiceMiddleware(
    authMiddleware,
    enableTracingMiddleware,
    getEnvironmentConfig({
      local: {
        apiHost: replaceConfig('https://[host]:[port]', {
          '[host]': envConfig('HOST', 'runtime', 'localhost'),
          '[port]': envConfig('PORT', 'runtime', '3000')
        }),
        uiHost: replaceConfig('https://[host]:[port]', {
          '[host]': envConfig('HOST', 'runtime', 'localhost'),
          '[port]': envConfig('PORT', 'runtime', '3000')
        }),
      },
      deployed: {
        apiHost: replaceConfig('https://[host]', {
          '[host]': envConfig('API_HOST', 'runtime')
        }),
        uiHost: replaceConfig('https://[host]', {
          '[host]': envConfig('UI_HOST', 'runtime')
        })
      },
    })
  )},
  async(_params: undefined, services) => {
    const apiHost = await resolveConfigValue(services.environmentConfig.apiHost);
    const json: JsonCompatibleStruct = await services.profile.trackFetch(fetch)(
      apiHost + renderRouteUrl(apiV0Index, undefined),
      await services.authProvider.getAuthorizedFetchConfig()
    )
      .then(response => response.json());

    return apiJsonResponse(200, json);
  }
);

export const apiV0ExampleRoutes = () =>  ([
  apiV0ExampleError,
  apiV0ExampleReverseRouting,
  apiV0GetExampleDocHistory,
  apiV0GetExampleDoc,
  apiV0SearchExampleDoc,
  apiV0WriteExampleDoc,
  apiV0SubRequest,
]);

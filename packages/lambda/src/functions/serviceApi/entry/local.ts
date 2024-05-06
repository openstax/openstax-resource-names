import path from 'path';
import url from 'url';
import { getKeyValue } from '@openstax/ts-utils';
import { ifDefined } from '@openstax/ts-utils/guards';
import { subrequestAuthProvider } from '@openstax/ts-utils/services/authProvider/subrequest';
import { fileSystemVersionedDocumentStore } from '@openstax/ts-utils/services/versionedDocumentStore/file-system';
import {NextFunction, Request, Response} from 'express';
import fetch from 'node-fetch';
import queryString from 'query-string';
import { createSearchClient } from '../../../services/searchClient/searchClient';
import { composeResponseMiddleware, getRequestResponder, slowResponseMiddleware } from '../core/request';
import { ApiRouteRequest } from '../core/types';

// when this runs its from the /build/src dir, so theres an extra up here
const dataDir = path.join(__dirname, '../../../../../data');

const services = {
  getEnvironmentConfig: getKeyValue('local'),
  versionedDocumentStore: fileSystemVersionedDocumentStore({dataDir}),
  createAuthProvider: subrequestAuthProvider({configSpace: 'local', fetch}),
  createSearchClient: createSearchClient({configSpace: 'local', fetch}),
};

export type LocalServices = typeof services;

export const handler = (request: Request, response: Response, next: NextFunction) => {
  const getRequestResponse = getRequestResponder(services, composeResponseMiddleware(
    slowResponseMiddleware,
  ));
  const {pathname, search} = url.parse(request.url);

  // https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html#apigateway-example-event
  const payload = {
    cookies: request.headers.cookie ? request.headers.cookie.split('; ') : [],
    headers: request.headers,
    body: request.body,
    // https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html
    // APIGatewayProxyEventV2 no longer has multiValueQueryStringParameters, instead it joins multiple values on comma
    queryStringParameters: search
      ? Object.fromEntries(
        Object.entries(queryString.parse(search)).map(([key, entry]) => [key, entry instanceof Array ? entry.join(',') : entry])
      )
      : undefined,
    requestContext: {
      http: {
        method: request.method,
        path: pathname
      }
    }
  } as ApiRouteRequest;

  const responsePromise = getRequestResponse(payload);

  if (!responsePromise) {
    return next();
  }

  responsePromise.then(apiResponse => {
    // TODO - other stuff in the response
    response.status(ifDefined(apiResponse.statusCode, 200));
    response.set(apiResponse.headers);

    response.end(apiResponse.isBase64Encoded
      ? Buffer.from(apiResponse.body, 'base64')
      : apiResponse.body
    );
  });
};

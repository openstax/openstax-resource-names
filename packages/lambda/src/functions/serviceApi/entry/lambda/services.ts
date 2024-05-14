import { getKeyValue } from '@openstax/ts-utils';
import { createLambdaCorsResponseMiddleware } from '@openstax/ts-utils/middleware/lambdaCorsResponseMiddleware';
import { createThrowNotFoundMiddleware } from '@openstax/ts-utils/middleware/throwNotFoundMiddleware';
import { decryptionAuthProvider } from '@openstax/ts-utils/services/authProvider/decryption';
import { dynamoUnversionedDocumentStore } from '@openstax/ts-utils/services/documentStore/unversioned/dynamodb';
import fetch from 'node-fetch';
import { createSearchClient } from '../../../../services/searchClient/searchClient';
import { composeResponseMiddleware, slowResponseMiddleware } from '../../core/request';
import { ApiRouteResponse } from '../../core/types';

export const lambdaServices = {
  getEnvironmentConfig: getKeyValue('deployed'),
  unversionedDocumentStore: dynamoUnversionedDocumentStore(),
  createAuthProvider: decryptionAuthProvider({configSpace: 'deployed'}),
  createSearchClient: createSearchClient({configSpace: 'deployed', fetch}),
};

export type LambdaServices = typeof lambdaServices;

export const lambdaMiddleware = composeResponseMiddleware(
  createLambdaCorsResponseMiddleware({
    corsAllowedHostRegex: '(openstax.org|herokuapp.com)$'
  }),
  slowResponseMiddleware,
  createThrowNotFoundMiddleware<ApiRouteResponse>()
);

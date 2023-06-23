import { getKeyValue } from '@openstax/ts-utils';
import { decryptionAuthProvider } from '@openstax/ts-utils/services/authProvider/decryption';
import { dynamoVersionedDocumentStore } from '@openstax/ts-utils/services/versionedDocumentStore/dynamodb';
import { composeResponseMiddleware, corsResponseMiddleware, default404Middleware, profileReportMiddleware } from '../../core/request';

export const lambdaServices = {
  getEnvironmentConfig: getKeyValue('deployed'),
  versionedDocumentStore: dynamoVersionedDocumentStore(),
  createAuthProvider: decryptionAuthProvider({configSpace: 'deployed'})
};

export type LambdaServices = typeof lambdaServices;

export const lambdaMiddleware = composeResponseMiddleware(
  corsResponseMiddleware,
  profileReportMiddleware,
  default404Middleware,
);

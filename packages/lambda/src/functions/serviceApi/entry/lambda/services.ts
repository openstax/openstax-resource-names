import { S3Client } from '@aws-sdk/client-s3';
import { getKeyValue } from '@openstax/ts-utils';
import { createLambdaCorsResponseMiddleware } from '@openstax/ts-utils/middleware/lambdaCorsResponseMiddleware';
import { createThrowNotFoundMiddleware } from '@openstax/ts-utils/middleware/throwNotFoundMiddleware';
import { decryptionAuthProvider } from '@openstax/ts-utils/services/authProvider/decryption';
import { s3FileServer } from '@openstax/ts-utils/services/fileServer/s3FileServer';
import { captureAWSv3Client } from 'aws-xray-sdk';
import fetch from 'node-fetch';
import { createSearchContentClient } from '../../../../services/searchClient/searchContentClient';
import { composeResponseMiddleware, slowResponseMiddleware } from '../../core/request';
import { ApiRouteResponse } from '../../core/types';

export const lambdaServices = {
  createAuthProvider: decryptionAuthProvider({configSpace: 'deployed'}),
  createFileServer: s3FileServer({
    configSpace: 'deployed',
    getS3Client: /* istanbul ignore next */ (...args) => captureAWSv3Client(new S3Client(...args))
  }),
  createSearchContentClient: createSearchContentClient({configSpace: 'deployed', fetch}),
  getEnvironmentConfig: getKeyValue('deployed'),
};

export type LambdaServices = typeof lambdaServices;

export const lambdaMiddleware = composeResponseMiddleware(
  createLambdaCorsResponseMiddleware({
    corsAllowedHostRegex: '(\\.local|localhost|openstax.org|herokuapp.com)$'
  }),
  slowResponseMiddleware,
  createThrowNotFoundMiddleware<ApiRouteResponse>()
);

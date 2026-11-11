import { S3Client } from '@aws-sdk/client-s3';
import { getKeyValue } from '@openstax/ts-utils';
import { envConfig } from '@openstax/ts-utils/config';
import { createLambdaCorsResponseMiddleware } from '@openstax/ts-utils/middleware/lambdaCorsResponseMiddleware';
import { createNotFoundResponseMiddleware } from '@openstax/ts-utils/middleware/notFoundResponseMiddleware';
import { decryptionAuthProvider } from '@openstax/ts-utils/services/authProvider/decryption';
import { s3FileServer } from '@openstax/ts-utils/services/fileServer/s3FileServer';
import { createFlushLoggerMiddleware } from '@openstax/ts-utils/services/logger';
import { createConsoleLogger } from '@openstax/ts-utils/services/logger/console';
import { captureAWSv3Client } from 'aws-xray-sdk';
import fetch from 'node-fetch';
import { createSearchContentClient } from '../../../../services/searchClient/searchContentClient';
import { composeResponseMiddleware, slowResponseMiddleware } from '../../core/request';
import { ApiRouteResponse } from '../../core/types';

export const lambdaServices = {
  logger: createConsoleLogger({context: {codeVersion: envConfig('CODE_VERSION')}}),
  createAuthProvider: decryptionAuthProvider({configSpace: 'deployed', fetch}),
  createFileServer: s3FileServer({
    configSpace: 'deployed',
    getS3Client: /* istanbul ignore next */ (...args) => captureAWSv3Client(new S3Client(...args))
  }),
  createSearchContentClient: createSearchContentClient({configSpace: 'deployed', fetch}),
  getEnvironmentConfig: getKeyValue('deployed'),
};

export type LambdaServices = typeof lambdaServices;

export const lambdaMiddleware = composeResponseMiddleware(
  // before cors, so 404s get cors headers
  createNotFoundResponseMiddleware(),
  createLambdaCorsResponseMiddleware({
    corsAllowedHostRegex: '(\\.local|localhost|openstax.org|herokuapp.com)$'
  }),
  slowResponseMiddleware,
  // last, so everything above has logged before the lambda can suspend
  createFlushLoggerMiddleware<ApiRouteResponse>()
);

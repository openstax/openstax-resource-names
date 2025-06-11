import { envConfig, lambdaParameterConfig, replaceConfig } from '@openstax/ts-utils/config';
import type { Logger } from '@openstax/ts-utils/services/logger';
import { ApiRouteRequest, AppServices } from '../../../core';

const config = {
  local: {
    accountsBase: 'https://dev.openstax.org/accounts',
    cookieName: 'oxa_dev',
  },
  deployed: {
    cookieName: envConfig('COOKIE_NAME', 'runtime'),
    encryptionPrivateKey: lambdaParameterConfig(
      replaceConfig('/[app]/[env]/api/EncryptionPrivateKey', {
        '[app]': envConfig('APPLICATION'),
        '[env]': envConfig('ENV_NAME', 'runtime')
      })
    ),
    signaturePublicKey: envConfig('SIGNATURE_PUBLIC_KEY', 'runtime'),
  },
};

export const authMiddleware = ({createAuthProvider}: AppServices) => {
  const authProvider = createAuthProvider(config);

  return <M extends {request: ApiRouteRequest; logger: Logger}>(middleware: M) => {
    return {
      ...middleware,
      authProvider: authProvider(middleware)
    };
  };
};

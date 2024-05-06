import { envConfig, lambdaParameterConfig, replaceConfig } from '@openstax/ts-utils/config';
import { ApiRouteRequest, AppServices } from '../../../core';

const config = {
  local: {
    accountsBase: 'https://dev.openstax.org/accounts',
    cookieName: 'oxa_dev',
  },
  deployed: {
    cookieName: lambdaParameterConfig(
      replaceConfig('/[app]/[env]/api/CookieName', {
        '[app]': envConfig('APPLICATION'),
        '[env]': envConfig('ENV_NAME', 'runtime')
      })
    ),
    encryptionPrivateKey: lambdaParameterConfig(
      replaceConfig('/[app]/[env]/api/EncryptionPrivateKey', {
        '[app]': envConfig('APPLICATION'),
        '[env]': envConfig('ENV_NAME', 'runtime')
      })
    ),
    signaturePublicKey: lambdaParameterConfig(
      replaceConfig('/[app]/[env]/api/SignaturePublicKey', {
        '[app]': envConfig('APPLICATION'),
        '[env]': envConfig('ENV_NAME', 'runtime')
      })
    ),
  },
};

export const authMiddleware = ({createAuthProvider}: AppServices) => {
  const authProvider = createAuthProvider(config);

  return <M extends {request: ApiRouteRequest}>(middleware: M) => {
    return {
      ...middleware,
      authProvider: authProvider(middleware)
    };
  };
};

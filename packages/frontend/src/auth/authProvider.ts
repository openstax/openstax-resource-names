import { browserAuthProvider } from '@openstax/ts-utils/services/authProvider/browser';
import { FrontendConfigProvider } from '../configProvider';

export const createAuthProvider = (
  ...args: Parameters<typeof browserAuthProvider>
) => (configProvider: FrontendConfigProvider) => browserAuthProvider(...args)({
  auth: {
    accountsBase: () => configProvider.getValue('accountsBase'),
  }
});

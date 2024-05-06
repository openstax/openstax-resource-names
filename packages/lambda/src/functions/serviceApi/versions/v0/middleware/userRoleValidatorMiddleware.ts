import { envConfig } from '@openstax/ts-utils/config';
import { AuthProvider } from '@openstax/ts-utils/services/authProvider';
import { createUserRoleValidator } from '@openstax/ts-utils/services/authProvider/utils/userRoleValidator';

const config = {
  application: envConfig('APPLICATION')
};

export const roleValidatorConfig = config;

export const userRoleValidatorMiddleware = () => {
  return <M extends {authProvider: AuthProvider}>(middleware: M) => {
    return {
      ...middleware,
      roleValidator: createUserRoleValidator(middleware.authProvider, config),
    };
  };
};

import { stubAuthProvider } from '@openstax/ts-utils/services/authProvider';
import { userRoleValidatorMiddleware } from './userRoleValidatorMiddleware';

describe('userRoleValidatorMiddleware', () => {
  const envBack = process.env;

  beforeEach(() => {
    process.env = {...process.env};
  });

  afterEach(() => {
    process.env = envBack;
  });

  it('works', async () => {
    process.env.APPLICATION = 'test';
    const authProvider = stubAuthProvider(undefined);
    const middleware = userRoleValidatorMiddleware()({authProvider});
    await expect(() => middleware.roleValidator.assertUserRole(['admin'])).rejects.toThrowErrorMatchingInlineSnapshot('"UnauthorizedError"');
  });
});

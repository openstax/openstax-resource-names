import { assertDefined } from "@openstax/ts-utils/assertions";

export const config = {
  auth: {
    accountsUrl: () => process.env.NODE_ENV === 'production'
      ? assertDefined(process.env.REACT_APP_ACCOUNTS_URL, 'REACT_APP_ACCOUNTS_URL must be provided in production')
      : '/'
  }
};

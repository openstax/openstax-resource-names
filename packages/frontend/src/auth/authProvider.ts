import { config } from "./config";
import {browserAuthProvider} from '@openstax/ts-utils/services/authProvider/browser';

export const createAuthProvider = (
  ...args: Parameters<typeof browserAuthProvider>
) => browserAuthProvider(...args)(config);

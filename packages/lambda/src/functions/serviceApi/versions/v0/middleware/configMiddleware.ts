// TODO - if we make this even more generic so that it doesn't rely on the app specific base config type, we can move it to ts-utils/config
import { AppServices, BaseEnvironmentConfig } from '../../../core/types';

export const getEnvironmentConfig = <P extends BaseEnvironmentConfig>(config: P) => ({getEnvironmentConfig}: AppServices) => <M extends {}>(middleware: M) => {
  const environmentConfig = getEnvironmentConfig(config);
  return {...middleware, environmentConfig};
};

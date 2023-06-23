import { getKeyValue } from '@openstax/ts-utils';
import { AppServices } from '../../../core/types';
import { getEnvironmentConfig } from './configMiddleware';

describe('getEnvironmentConfig', () => {
  it('gets the environment config', () => {
    const result = getEnvironmentConfig({local: {test: 'local'}, deployed: {test: 'deployed'}})({getEnvironmentConfig: getKeyValue('local')} as AppServices)({});
    expect(result.environmentConfig.test).toBe('local');
  });
});

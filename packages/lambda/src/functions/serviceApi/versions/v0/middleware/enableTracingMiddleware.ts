import { envConfig, resolveConfigValue } from '@openstax/ts-utils/config';
import { Track } from '@openstax/ts-utils/profile';
import { getHeader } from '@openstax/ts-utils/routing';
import { ApiRouteRequest, AppServices } from '../../../core/types';

const config = {
  local: {
    tracingEnabled: 'true',
  },
  deployed: {
    tracingEnabled: envConfig('TRACING_ENABLED', 'runtime', 'false'),
  },
};

export const enableTracingMiddleware = <M extends {request: ApiRouteRequest; profile: Track}>(app: AppServices) => (middleware: M) => {

  middleware.profile.setTracing(
    !!(
      middleware.request.queryStringParameters?.profile
      || getHeader(middleware.request.headers, 'x-application-profile')
    ) 
    && resolveConfigValue(app.getEnvironmentConfig(config).tracingEnabled)
      .then(value => value === 'true')
  );

  return middleware;
};

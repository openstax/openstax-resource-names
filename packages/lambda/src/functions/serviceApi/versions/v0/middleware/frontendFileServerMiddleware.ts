import { envConfig } from '@openstax/ts-utils/config';
import { ApiRouteRequest, AppServices } from '../../../core';

const config = {
  local: {
    storagePrefix: '../../frontend',
  },
  deployed: {
    bucketName: envConfig('FRONTEND_BUILD_BUCKET', 'runtime'),
    bucketRegion: envConfig('AWS_REGION', 'runtime'),
  },
};

export const frontendFileServerMiddleware = ({ createFileServer }: AppServices) => {
  const frontendFileServer = createFileServer(config);

  return <M extends {request: ApiRouteRequest}>(middleware: M) => {
    return {
      ...middleware,
      frontendFileServer
    };
  };
};

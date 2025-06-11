import { envConfig } from '@openstax/ts-utils/config';
import { AppServices } from '../../../core';

export const config = {
  local: {
    searchHost: 'https://dev.openstax.org/open-search',
  },
  deployed: {
    searchHost: envConfig('SEARCH_HOST', 'runtime'),
  },
};

export const searchContentMiddleware = ({createSearchContentClient}: AppServices) => {
  const searchContentClient = createSearchContentClient(config);

  return <M extends {}>(middleware: M) => {
    return { ...middleware, searchContentClient };
  };
};

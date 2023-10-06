import { envConfig, lambdaParameterConfig, replaceConfig } from '@openstax/ts-utils/config';
import { AppServices } from '../../../core';

export const config = {
  local: {
    searchHost: 'https://dev.openstax.org/open-search',
  },
  deployed: {
    searchHost: lambdaParameterConfig(
      replaceConfig('/[app]/[env]/api/SearchHost', {
        '[app]': envConfig('APPLICATION'),
        '[env]': envConfig('ENV_NAME', 'runtime')
      })
    ),
  },
};

export const searchMiddleware = ({createSearchClient}: AppServices) => {
  const searchClient = createSearchClient(config);

  return <M extends {}>(middleware: M) => {
    return { ...middleware, searchClient };
  };
};

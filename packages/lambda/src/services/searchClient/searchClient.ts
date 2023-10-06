import { Configuration, SearchApi, SearchRequest } from '@openstax/open-search-client';
import { once } from '@openstax/ts-utils';
import { ConfigProviderForConfig, resolveConfigValue } from '@openstax/ts-utils/config';
import { GenericFetch } from '@openstax/ts-utils/fetch';
import { ifDefined } from '@openstax/ts-utils/guards';

export type Config = {
  searchHost: string;
};
interface Initializer<C> {
  configSpace?: C;
  fetch: GenericFetch;
}

export const createSearchClient = <C extends string = 'search'>(initializer: Initializer<C>) => (configProvider: {[key in C]: ConfigProviderForConfig<Config>}) => {
  const config = configProvider[ifDefined(initializer.configSpace, 'search' as C)];
  const searchHost = resolveConfigValue(config.searchHost);
  const getSearchApi = once(async() => new SearchApi(new Configuration({
    basePath: await searchHost,
    fetchApi: initializer.fetch,
  })));

  return { search: async(requestParameters: SearchRequest) => (await getSearchApi()).search(requestParameters) };
};

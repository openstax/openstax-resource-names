import type { SearchApi } from '@openstax/open-search-client';
import type { OrnCacheStore } from './ornCacheStore';

export type SearchClient = Pick<SearchApi, 'search'>;

export type SearchServices = {
  ornCacheStore: OrnCacheStore;
  searchClient: SearchClient;
};

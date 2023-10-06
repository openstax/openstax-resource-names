import type { SearchApi } from '@openstax/open-search-client';

export type SearchClient = Pick<SearchApi, 'search'>;

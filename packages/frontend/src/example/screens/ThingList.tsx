import React from 'react';
import { createRoute, makeScreen } from "../../core/services";
import { Layout } from "../components/Layout";
import { UnwrapPromise } from "@openstax/ts-utils/types";
import { useQuery } from "../../routing/useQuery";
import { thingViewScreen } from "./ThingView";
import { RouteLink } from "../../routing/components/RouteLink";
import { fetchLoading,
  FetchState,
  fetchSuccess,
  fetchError,
  stateHasData,
  stateHasError
} from "@openstax/ts-utils/fetch";
import { ApiClient, useApiClient } from "../api";

// query params are not strongly typed... yet
type SearchOptions = {
  page?: string;
};

/*
 * this execute function is sometimes unnecessary, but in this case its
 * kinda nice to use it to extract the SearchData return type for the data.
 *
 * if there is a convenient type in the api that represents the return type
 * like a model or something you could also use that directly
 * */
const executeSearch = (apiClient: ApiClient, options: SearchOptions) => {
  return apiClient.apiV0SearchExampleDoc({query: options})
    .then(response => response.acceptStatus(200).load());
};
type SearchData = UnwrapPromise<ReturnType<typeof executeSearch>>;

const useSearch = (options: SearchOptions) => {
  const apiClient = useApiClient();
  const [pageData, setPageData] = React.useState<FetchState<SearchData, string>>(fetchLoading());

  React.useEffect(() => {
    executeSearch(apiClient, options)
      .then(data => setPageData(fetchSuccess(data)))
      .catch(() => setPageData(previous => fetchError('connection failed', previous)))
    ;
  }, [apiClient, options]);

  return pageData;
};

const SearchResults = ({searchData, options}: {searchData: SearchData; options: SearchOptions}) => {
  const {currentPage, totalPages} = searchData.meta;

  return <div>
    <ol>
      {searchData.items.map(item => <li key={item.id}>
        <RouteLink route={thingViewScreen} params={{id: item.id}}>{item.name}</RouteLink>
      </li>)}
    </ol>

    {currentPage > 1
      ? <RouteLink route={thingListScreen} query={{...options, page: String(currentPage - 1)}}>prev page</RouteLink>
      : null
    }
    {currentPage < totalPages
      ? <RouteLink route={thingListScreen} query={{...options, page: String(currentPage + 1)}}>next page</RouteLink>
      : null
    }
  </div>;

};

export const ThingList = () => {
  const options = useQuery();
  const searchState = useSearch(options);

  return <Layout title="Thing List">
    {stateHasError(searchState) ? searchState.error : null}
    {stateHasData(searchState) ? <SearchResults searchData={searchState.data} options={options} /> : null}
  </Layout>;
};

export const thingListScreen = createRoute({name: 'ThingList', path: '/thing-list',
  handler: makeScreen(ThingList),
});

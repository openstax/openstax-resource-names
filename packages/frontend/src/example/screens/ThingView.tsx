import React from 'react';
import { createRoute, makeScreen } from "../../core/services";
import { Layout } from "../components/Layout";
import {
  FetchState,
  fetchLoading,
  fetchError,
  fetchSuccess,
  stateHasData,
  stateHasError
} from "@openstax/ts-utils/fetch";
import { useApiClient } from "../api";
import {
  ExampleDocument
} from "@project/lambdas/build/src/functions/serviceApi/versions/v0/example/documentStoreMiddleware";

const useGetDocument = (id: string) => {
  const apiClient = useApiClient();
  const [data, setData] = React.useState<FetchState<ExampleDocument, string>>(fetchLoading());

  React.useEffect(() => {
    apiClient.apiV0GetExampleDoc({params: {key: id}})
      .then(response => response.acceptStatus(200, 404))
      .then(response => response.status === 200 ? response.load() : undefined)
      .then(data => data !== undefined
        ? setData(fetchSuccess(data))
        : setData(previous => fetchError('item not found', previous))
      )
      .catch(() => setData(previous => fetchError('connection failed', previous)))
    ;
  }, [apiClient, id]);

  return data;
};

export const ThingView = ({id}: {id: string}) => {
  const state = useGetDocument(id);

  return <Layout title={`Thing: ${stateHasData(state) ? state.data.name : ''}`}>
    {stateHasError(state) ? state.error : null}
    {stateHasData(state) ? <pre>{JSON.stringify(state.data, null, 2)}</pre> : null}
  </Layout>;
};

export const thingViewScreen = createRoute({name: 'ThingView', path: '/things/:id',
  handler: makeScreen(ThingView),
});

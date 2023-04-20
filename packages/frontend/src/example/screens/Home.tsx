import { FetchStateType, stateHasData, stateHasError } from "@openstax/ts-utils/fetch";
import React from 'react';
import { useApiClient } from "../api";
import { Layout } from "../components/Layout";
import { useAccountsUrl, useAuth } from "../../auth/useAuth";
import { useFrontendConfigValue } from "../../configProvider/use";
import { createRoute, makeScreen } from "../../core/services";

export const Home = () => {
  const [message, setMessage] = React.useState<string>();
  const accountsBaseUrl = useAccountsUrl();
  const user = useAuth();
  const apiClient = useApiClient();
  const configExampleMessage = useFrontendConfigValue('EXAMPLE_MESSAGE');

  React.useEffect(() => {
    apiClient.apiV0Info({fetchConfig: {credentials: 'include'}})
      .then(response => response.acceptStatus(200).load())
      .then(response => setMessage(response.message))
    ;
    /* example edit/create
     *
    apiClient.apiV0WriteTestDoc({
      params: {foobar: 'idString'},
      payload: {name: 'cool name', description: 'cool description'},
      fetchConfig: {credentials: 'include'}
    })
      .then(response => response.acceptStatus(201).load())
      .then(response => console.log(response))
    ;
    */
  }, [apiClient]);

  return (
    <Layout title="Home">
      <p>
        {message}
      </p>
      {stateHasData(configExampleMessage) && <p>
        {configExampleMessage.data}
      </p>}
      {!!stateHasData(user) && user.data && <>
        <a
          href={`${accountsBaseUrl}accounts/logout?r=${window.location.pathname}`}
          rel="noopener noreferrer"
        >
          logout
        </a>
      </>}
      {stateHasData(user) && !user.data && <>
        <a
          href={`${accountsBaseUrl}accounts/login?r=${window.location.pathname}`}
          rel="noopener noreferrer"
        >
          login
        </a>
        <a
          href={`${accountsBaseUrl}accounts/signup?r=${window.location.pathname}`}
          rel="noopener noreferrer"
        >
          signup
        </a>
      </>}
      {stateHasError(user) && <strong>error loading user</strong>}
      {user.type === FetchStateType.LOADING ? <em>establishing user state</em> : null}
    </Layout>
  );
};

export const homeScreen = createRoute({name: 'HomeScreen', path: '/',
  handler: makeScreen(Home)
});

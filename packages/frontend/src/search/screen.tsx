import { FetchState, fetchSuccess, stateHasData, fetchIdle } from "@openstax/ts-utils/fetch";
import styled from "styled-components";
import type {SearchResponse} from '@openstax/orn-locator';
import React from 'react';
import { useApiClient } from "./api";
import { createRoute, makeScreen } from "../core/services";
import * as UI from '@openstax/ui-components';

const Forms = UI.Forms.Controlled;

const StyledForm = styled(Forms.Form)`
  max-width: 60rem;
  margin: 10rem auto;
  display: flex;
  flex-direction: row;
  align-items: flex-end;

  label {
    flex: 1;
    font-size: 1.4rem;
  }
  input {
    font-size: 3rem;
  }
`;

const StyledButton = styled(UI.Button)`
  && {
    margin-top: 0;
  }

  margin-left: 1rem;
`;

const StyledTabPanel = styled(UI.TabPanel)`
  margin: 1rem 0;

  ol {
    list-style: none;
    margin: 0 0 2rem 0;
    padding: 0;

    li:hover {
      background-color: #eee;
    }

    li {
      padding: 1rem 5rem;
      font-size: 3rem;
      border-bottom: 1px solid #ccc;

      small {
        font-size: 1.2rem;
      }

      a {
        display: block;
        padding: 0;
        margin: 0;
        text-decoration: none;
        color: inherit;
      }
    }

    li:last-child {
      border-bottom: none;
    }
  }
`;

type SearchData = {query?: string};

const Search = () => {
  const apiClient = useApiClient();
  const state = fetchSuccess<SearchData>({});
  const setAppError = UI.useSetAppError();
  const [resultState, setResultState] = React.useState<FetchState<SearchResponse, string>>(fetchIdle());

  const doSearch = React.useCallback((data: Partial<SearchData>) => {

    apiClient.apiV0Search({query: data})
      .then(response => response.acceptStatus(200))
      .then(response => response.load())
      .then(result => setResultState(fetchSuccess(result)))
      .catch(setAppError);
  }, [apiClient, setAppError]);

  return <>
    <StyledForm state={state} onSubmit={doSearch}>
      <Forms.TextInput name="query" label="Search" />
      <StyledButton type="submit">Search</StyledButton>
    </StyledForm>

    {stateHasData(resultState) ?
      <UI.Tabs size='large'>
      <UI.TabList aria-label="Items">
        {Object.entries(resultState.data).map(([key, result]) =>
          <UI.Tab key={key} id={key}>{result.name}</UI.Tab>
        )}
      </UI.TabList>

      {Object.entries(resultState.data).map(([key, result]) => <StyledTabPanel key={key} id={key}>
        <ol>
          {result.items.map(item => <li key={item.orn}>
            {'urls' in item
              ? <a href={item.urls.main}>{item.title}<br /><small>{item.orn}</small></a>
              : <>item.title<br /><small>{item.orn}</small></>
            }
          </li>)}
        </ol>
      </StyledTabPanel>)}
    </UI.Tabs>
    : null}
  </>;
};

export const searchScreen = createRoute({name: 'SearchScreen', path: '/',
  handler: makeScreen(Search)
});

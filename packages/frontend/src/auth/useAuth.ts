import React from 'react';
import { User } from "@openstax/ts-utils/services/authProvider";
import { resolveConfigValue } from "@openstax/ts-utils/config";
import { config } from "./config";
import { useServices } from "../core/context/services";
import { FetchState, fetchSuccess, fetchLoading } from "@openstax/ts-utils/fetch";

export const useAuth = () => {
  const authProvider = useServices().authProvider;
  const [state, setUser] = React.useState<FetchState<User | undefined, string>>(fetchLoading());

  React.useEffect(() => {
    authProvider.getUser().then(user => setUser(fetchSuccess(user)));
  }, [authProvider]);

  return state;
};

export const useAccountsUrl = () => {
  const [url, setUrl] = React.useState<string>();

  React.useEffect(() => {
    resolveConfigValue(config.auth.accountsUrl).then(setUrl);
  }, []);

  return url;
};

import React from 'react';
import { User } from "@openstax/ts-utils/services/authProvider";
import { useServices } from "../core/context/services";
import { useSetAppError } from '@openstax/ui-components';
import { FetchState, fetchSuccess, fetchLoading } from "@openstax/ts-utils/fetch";
import { useFrontendConfigValue } from '../configProvider/use';

export const useAuth = () => {
  const authProvider = useServices().authProvider;
  const setAppError = useSetAppError();
  const [state, setUser] = React.useState<FetchState<User | undefined, string>>(fetchLoading());

  React.useEffect(() => {
    authProvider.getUser()
      .then(user => setUser(fetchSuccess(user)))
      .catch(setAppError);
  }, [authProvider, setAppError]);

  return state;
};

export const useUserRoles = () => {
  const roleValidator = useServices().roleValidator;
  const [state, setRoles] = React.useState<FetchState<string[], string>>(fetchLoading());

  React.useEffect(() => {
    roleValidator.getUserRoles().then(roles => setRoles(fetchSuccess(roles)));
  }, [roleValidator]);

  return state;
};

export const useAccountsBase = () => useFrontendConfigValue('accountsBase');

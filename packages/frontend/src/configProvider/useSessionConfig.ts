import type {
  SessionConfig
} from '@project/lambdas/build/src/functions/serviceApi/versions/v0';
import React from 'react';
import { FetchState, FetchStateType, fetchError, fetchLoading, fetchSuccess } from '@openstax/ts-utils/fetch';
import { once } from '@openstax/ts-utils/misc/helpers';
import { useSetAppError } from '@openstax/ui-components';
import { ApiClient } from '../api';
import { useServices } from '../core/context/services';

export type { SessionConfig };

declare global {
  interface Window {
    _OX_SESSION_CONFIG?: SessionConfig;
  }
}

const makeProvider = <C extends object>(fromDocument: () => C | undefined, load: () => Promise<C>) => {
  // the api call is the local dev path, where nothing was server rendered
  const getConfig = once(async(): Promise<C> => fromDocument() ?? load());

  const getValue = async <K extends keyof C>(name: K): Promise<C[K]> => {
    const config = await getConfig();
    if (name in config) {
      return config[name];
    }
    throw new Error(`Session config variable ${String(name)} not found in the session config`);
  };

  return { getConfig, getValue };
};

export const makeSessionConfigProvider = (apiClient: ApiClient) => makeProvider(
  () => window._OX_SESSION_CONFIG,
  () => apiClient.apiV0SessionConfig({})
    .then(response => response.acceptStatus(200))
    .then(response => response.load())
);

export type SessionConfigProvider = ReturnType<typeof makeSessionConfigProvider>;

export const useSessionConfig = () => {
  const sessionConfigProvider = useServices().sessionConfigProvider;
  const [sessionConfig, setSessionConfig] = React.useState<FetchState<SessionConfig, string>>(fetchLoading());
  const setAppError = useSetAppError();

  React.useEffect(() => {
    sessionConfigProvider.getConfig()
      .then((config) => setSessionConfig(fetchSuccess(config)))
      .catch(setAppError);
  }, [sessionConfigProvider, setAppError]);

  return sessionConfig;
};

export const useSessionConfigValue = <K extends keyof SessionConfig>(
  name: K
): FetchState<SessionConfig[K], string> => {
  const [value, setValue] = React.useState<FetchState<SessionConfig[K], string>>(fetchLoading());
  const sessionConfig = useSessionConfig();

  React.useEffect(() => {
    /*
     * no falsy check on the value here - unlike frontend config, which is all
     * strings, a session config value may legitimately be false.
     */
    if (sessionConfig.type === FetchStateType.SUCCESS) {
      setValue(fetchSuccess(sessionConfig.data[name]));
    } else if (sessionConfig.type === FetchStateType.ERROR) {
      setValue(previous => fetchError('error loading session config', previous));
    }
  }, [sessionConfig, name]);

  return value;
};

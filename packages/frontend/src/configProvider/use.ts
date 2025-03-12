import React from 'react';
import { fetchError, FetchStateType, fetchSuccess, fetchLoading, FetchState } from '@openstax/ts-utils/fetch';
import { useSetAppError } from '@openstax/ui-components';
import { FrontendConfig } from '.';
import { useServices } from '../core/context/services';

export const useFrontendConfig = () => {
  const frontendConfigProvider = useServices().configProvider;
  const [frontendConfig, setFrontendConfig] = React.useState<FetchState<FrontendConfig, string>>(fetchLoading());
  const setAppError = useSetAppError();

  React.useEffect(() => {
    frontendConfigProvider.getConfig()
      .then((ee) => setFrontendConfig(fetchSuccess(ee)))
      .catch(setAppError);
  }, [frontendConfigProvider, setAppError]);

  return frontendConfig;
};

export const useFrontendConfigValue = (name: keyof FrontendConfig) => {
  const [frontendConfigValue, setFrontendConfigValue] = React.useState<
    FetchState<string, string>
  >(fetchLoading());
  const frontendConfig = useFrontendConfig();

  React.useEffect(() => {
    if (frontendConfig.type === FetchStateType.SUCCESS) {
      const data = frontendConfig.data[name];
      setFrontendConfigValue(previous => data
        ? fetchSuccess(data)
        : fetchError('configuration missing', previous)
      );
    } else if (frontendConfig.type === FetchStateType.ERROR) {
      setFrontendConfigValue(previous => fetchError('error loading config', previous));
    }
  }, [frontendConfig, name]);


  return frontendConfigValue;
};

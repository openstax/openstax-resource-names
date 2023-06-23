import React from 'react';
import { useServices } from "../core/context/services";
import { fetchError, FetchStateType, fetchSuccess, fetchLoading, FetchState } from "@openstax/ts-utils/fetch";

export type Config = { [key: string]: string };

export const useFrontendConfig = () => {
  const frontendConfigProvider = useServices().configProvider;
  const [frontendConfig, setFrontendConfig] = React.useState<FetchState<Config, string>>(fetchLoading());

  React.useEffect(() => {
    frontendConfigProvider.getConfig().then((ee) => setFrontendConfig(fetchSuccess(ee)));
  }, [frontendConfigProvider]);

  return frontendConfig;
};

export const useFrontendConfigValue = (name: string) => {
  const [frontendConfigValue, setFrontendConfigValue] = React.useState<
    FetchState<Config[string], string>
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

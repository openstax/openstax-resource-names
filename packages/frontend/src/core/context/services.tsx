import React from 'react';
import { AppServices } from "../types";

export const ServiceContext = React.createContext<() => AppServices>(
  () => { throw new Error('context not provided'); }
);

export const serviceProviderMiddleware = (services: AppServices) => (route: React.ReactNode) =>
  <ServiceContext.Provider value={() => services}>
    {route}
  </ServiceContext.Provider>
;

export const useServices = () => {
  return React.useContext(ServiceContext)();
};

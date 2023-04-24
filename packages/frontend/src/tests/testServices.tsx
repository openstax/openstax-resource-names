import React from 'react';
import { createMemoryHistory } from "history";
import { stubAuthProvider } from '@openstax/ts-utils/services/authProvider';
import { ServiceContext } from "../core/context/services";
import { AppServices } from "../core/types";

export const testApiGateway: {[key: string]: any} = {};

export const testServices = {
  createApiGateway: () => testApiGateway,
  history: createMemoryHistory(),
  authProvider: stubAuthProvider(),
  configProvider: { getConfig: async() => {}, getValue: async(_name: string) => undefined }
} as any as AppServices;

export const TestServiceProvider = ({children, ...services}: React.PropsWithChildren<Partial<AppServices>>) =>
  <ServiceContext.Provider value={() => ({...testServices, ...services})}>
    {children}
  </ServiceContext.Provider>
;

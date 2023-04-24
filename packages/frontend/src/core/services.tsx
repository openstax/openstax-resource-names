import React, {ReactNode} from 'react';
import { makeCreateRoute } from '@openstax/ts-utils/routing';
import { makeComposeMiddleware } from '@openstax/ts-utils/middleware';
import { AppServices } from './types';
import { Location } from "history";

export const composeRequestServiceMiddleware = makeComposeMiddleware<AppServices, {request: Location}>();
export const composeResponseServiceMiddleware = makeComposeMiddleware<AppServices, ReactNode>();

export const createRoute = makeCreateRoute<AppServices, Location>();

export const makeScreen = <P,>(Screen: React.ComponentType<P>) => (params: {} extends P ? undefined : P) => {
  return <Screen {...params as P} />;
};

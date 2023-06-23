import {ReactNode} from 'react';
import { makeRenderRouteUrl } from '@openstax/ts-utils/routing';
import { getKeyValue } from '@openstax/ts-utils';
import { exampleRoutes } from "../example/screens";
import { makeGetRequestResponder } from '@openstax/ts-utils/routing';
import { AppServices } from './types';
import { Location } from "history";

export const routes = () => ([
  ...exampleRoutes(),
]);

export type TRoutes = (ReturnType<typeof routes>)[number];

export const renderRouteUrl = makeRenderRouteUrl<TRoutes>();

export const getRequestResponder = makeGetRequestResponder<AppServices, TRoutes, Location, ReactNode>()({
  routes,
  pathExtractor: getKeyValue('pathname'),
});

import { makeRenderRouteUrl } from '@openstax/ts-utils/routing';
import { apiV0Routes } from '../versions/v0';

export const apiRoutes = () => ([
  ...apiV0Routes(),
]);

export type TRoutes = (ReturnType<typeof apiRoutes>)[number];

export const renderRouteUrl = makeRenderRouteUrl<TRoutes>();

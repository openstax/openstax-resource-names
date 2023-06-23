import React from 'react';
import { ParamsForRoute, renderAnyRouteUrl, AnyRoute, QueryParams } from "@openstax/ts-utils/routing";
import { useServices } from "../../core/context/services";
import { TRoutes } from "../../core";

export const createRouteLink = <Ru,>() => <R extends Ru>(
  params: React.PropsWithChildren<{route: R extends AnyRoute<R> ? R : never; query?: QueryParams}> & (
    ParamsForRoute<R> extends undefined ? {params?: undefined} : {params: ParamsForRoute<R>}
  )
) => {
  const services = useServices();
  const url = renderAnyRouteUrl<R>(params.route, params.params as ParamsForRoute<R>, params.query);

  return <a href={url} onClick={(e) => {
    e.preventDefault();
    services.history.push(url);
  }}>{params.children}</a>;
};

export const RouteLink = createRouteLink<TRoutes>();

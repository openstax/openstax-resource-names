import React from 'react';
import { ParamsForRoute, renderAnyRouteUrl, AnyRoute, QueryParams } from "@openstax/ts-utils/routing";
import { useServices } from "../../core/context/services";
import { TRoutes } from "../../core";

export const isClickWithModifierKeys = (e: React.MouseEvent | MouseEvent) =>
  e.shiftKey || e.ctrlKey || e.metaKey || e.altKey;

export const createRouteLink = <Ru,>() => <R extends Ru>(
  {
    route, params, query, children, ...props
  }: React.PropsWithChildren<{route: R extends AnyRoute<R> ? R : never; query?: QueryParams}> & (
    ParamsForRoute<R> extends undefined ? {params?: undefined} : {params: ParamsForRoute<R>}
  ) & React.HTMLProps<HTMLAnchorElement>
) => {
  const services = useServices();
  const url = renderAnyRouteUrl<R>(route, params as ParamsForRoute<R>, query);

  return <a {...props} href={url} onClick={(e) => {
    if (isClickWithModifierKeys(e) || props.target === '_blank') {
      return;
    }
    e.preventDefault();
    services.history.push(url);
  }}>{children}</a>;
};

export const RouteLink = createRouteLink<TRoutes>();

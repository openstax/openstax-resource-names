import React from 'react';
import { ParamsForRoute, renderAnyRouteUrl, AnyRoute, QueryParams } from "@openstax/ts-utils/routing";
import { useServices } from "core/context/services";
import { TRoutes } from "core";

export const isClickWithModifierKeys = (e: React.MouseEvent | MouseEvent) =>
  e.shiftKey || e.ctrlKey || e.metaKey || e.altKey;

export function useRouteLinkOnClick() {
  const {history} = useServices();

  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isClickWithModifierKeys(e) || e.currentTarget.getAttribute('target') === '_blank') {
      return;
    }
    e.preventDefault();
    const {pathname, search, hash} = new URL(e.currentTarget.href);
    const target = `${pathname}${search}${hash}`;
    history.push(target);
  };
}

export const createRouteLink = <Ru,>() => <R extends Ru>(
  {
    route, params, query, children, ...props
  }: React.PropsWithChildren<{route: R extends AnyRoute<R> ? R : never; query?: QueryParams}> & (
    ParamsForRoute<R> extends undefined ? {params?: undefined} : {params: ParamsForRoute<R>}
  ) & React.HTMLProps<HTMLAnchorElement>
) => {
  const url = renderAnyRouteUrl<R>(route, params as ParamsForRoute<R>, query);

  return <a {...props} href={url} onClick={useRouteLinkOnClick()}>{children}</a>;
};

export const RouteLink = createRouteLink<TRoutes>();

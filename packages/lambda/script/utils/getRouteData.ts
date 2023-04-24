export const getApiRouteData = (api: string) => require(`../../src/functions/${api}/core/routes`).apiRoutes().reduce((result: any, route: any) => ({
  ...result,
  [route.name]: {
    path: route.path,
    method: route.method,
  }
}), {});

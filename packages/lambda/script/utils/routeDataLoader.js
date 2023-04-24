// TODO - convert this file to ts
const routeData = require('./getRouteData').getApiRouteData('serviceApi');

// TODO - use `options` to pass `serviceApi` instead of using it literally 
/* eslint-disable no-unused-vars */
module.exports = (options, loaderContext) => {
  return { code: 'module.exports = ' + JSON.stringify(routeData) };
};

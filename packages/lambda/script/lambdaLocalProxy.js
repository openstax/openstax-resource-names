// TODO - convert this file to ts
const bodyParser = require('body-parser')

const noCacheRequire = (module) => {
  Object.keys(require.cache).forEach((key) => { delete require.cache[key] })
  return require(module);
}

const rawParser = bodyParser.raw({type: '*/*'});

/*
 * LAMBDA_LOCAL_PROXY_PREFIXES
 *
 * Only requests matching one of these path prefixes are forwarded to the
 * lambda handler. Everything else is passed through to the host dev-server
 * (Vite) so it can serve its own assets, HMR, etc.
 *
 * If your project adds routes outside of /api (e.g. /webhooks, /oauth/callback),
 * add the prefix here.
 */
const DEFAULT_PREFIXES = ['/api', '/.well-known'];

module.exports = function lambdaLocalProxy(app, fn, {prefixes = DEFAULT_PREFIXES} = {}) {
  app.use((req, res, next) => {
    const url = req.url || '';
    if (!prefixes.some((p) => url.startsWith(p))) return next();
    rawParser(req, res, () => {
      // this is included here so that you don't have to restart the server to get code changes
      const {handler} = noCacheRequire(`../src/functions/${fn}/entry/local`);
      handler(req, res, next);
    });
  })
}

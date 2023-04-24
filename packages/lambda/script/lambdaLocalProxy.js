// TODO - convert this file to ts
const bodyParser = require('body-parser')

const noCacheRequire = (module) => {
  Object.keys(require.cache).forEach((key) => { delete require.cache[key] })
  return require(module);
}

module.exports = function lambdaLocalProxy(app, fn) {
  app.use(bodyParser.raw({type: '*/*'}));
  app.use((...args) => {
    // this is included here so that you don't have to restart the server to get code changes
    const {handler} = noCacheRequire(`../src/functions/${fn}/entry/local`);
    handler(...args);
  })
}

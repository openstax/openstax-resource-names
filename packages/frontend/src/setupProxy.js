const proxy = require('http-proxy-middleware');
const lambdaLocalProxy = require('@project/lambdas/build/script/lambdaLocalProxy');

module.exports = function(app) {
  accountsProxy(app);
  lambdaLocalProxy(app, 'serviceApi');
};

function accountsProxy(app) {
  app.use(proxy('/accounts', {
    target: 'https://dev.openstax.org',
    changeOrigin: true,
    autoRewrite: true,
    cookieDomainRewrite: "",
    onProxyReq: (proxyRequest, request, response) => {
      proxyRequest.setHeader('X-Forwarded-Host', request.headers.host);
    }
  }));
}

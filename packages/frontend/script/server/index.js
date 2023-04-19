const express = require('express');
const http = require('http');
const path = require('path');
const serveStatic = require('serve-static');
const setupProxy = require('../../src/setupProxy');

const makeFallback = (serve) => (req, res, next) => {
  req.url = '/index.html';
  serve(req, res, next);
};

const makeServe = (baseDir) => {
  return serveStatic(baseDir, {redirect: false});
};

const makeOptions = (options) => ({
  port: process.env.PORT,
  ...options,
  baseDir: path.join(__dirname, '../../build'),
  onlyProxy: !!options.onlyProxy,
});

const makeMiddleware = (options) => {
  const app = express();

  setupProxy(app);

  if (!options.onlyProxy) {
    const serve = makeServe(options.baseDir);
    app.use(serve);
    app.use(makeFallback(serve));
  }

  return app;
};

const startServer = (options) => new Promise((resolve) => {
  const serverConfig = makeOptions(options);
  const app = makeMiddleware(serverConfig);
  const server = http.createServer(app);

  server.listen(serverConfig.port, () => resolve({server, port: serverConfig.port}));
});

module.exports = {
  startServer
};

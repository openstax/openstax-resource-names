/* spell-checker: ignore middlewares */
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import fs from 'node:fs';

function lambdaProxyPlugin(): Plugin {
  return {
    name: 'lambda-local-proxy',
    configureServer(server) {
      const lambdaLocalProxy = require('@project/lambdas/build/script/lambdaLocalProxy');
      lambdaLocalProxy(server.middlewares, 'serviceApi');
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    lambdaProxyPlugin(),
  ],

  resolve: {
    preserveSymlinks: true,
  },
  base: process.env.PUBLIC_URL || '/',

  build: {
    outDir: 'build',
    sourcemap: true,
    commonjsOptions: {
      include: [/node_modules/, /packages\/lambda\/build/],
    },
  },

  server: {
    cors: { origin: true, credentials: true },
    host: process.env.HOST || 'localhost',
    port: parseInt(process.env.PORT || '3000', 10),
    https: process.env.SSL_CRT_FILE ? {
      cert: fs.readFileSync(process.env.SSL_CRT_FILE),
      key: fs.readFileSync(process.env.SSL_KEY_FILE!),
    } : undefined,
    open: false,
    proxy: {
      '/accounts': {
        target: 'https://dev.openstax.org',
        changeOrigin: true,
        autoRewrite: true,
        cookieDomainRewrite: '',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // vite's HTTPS dev server runs over HTTP/2, where the host header
            // is delivered as the `:authority` pseudo-header instead of `host`.
            const host = req.headers.host || req.headers[':authority'];
            if (typeof host === 'string') {
              proxyReq.setHeader('X-Forwarded-Host', host);
            }
          });
        },
      },
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
    server: {
      deps: {
        // These packages must be inlined so Vitest runs them through Vite's
        // transform pipeline instead of Node's native ESM loader:
        //
        // @testing-library/jest-dom — its vitest entry uses CJS require('vitest')
        //   to call expect.extend(). Without inlining, Node resolves a separate
        //   CJS vitest instance from the ESM one the runner uses (the "dual
        //   package hazard"), so the extended expect has a different SnapshotClient
        //   than the one the runner initialized — breaking all snapshot matchers.
        inline: [/@testing-library\/jest-dom/],
      },
    },
    coverage: {
      reporter: ['text-summary', 'html', 'lcovonly'],
      include: ['src/*/**/*.{js,ts,tsx}'],
    },
  },
});

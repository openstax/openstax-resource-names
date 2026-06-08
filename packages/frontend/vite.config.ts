/* spell-checker: ignore middlewares */
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
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
    nodePolyfills({ include: ['crypto', 'stream'] }),
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
            if (req.headers.host) {
              proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
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
        //
        // @openstax/ui-components — ships a minified ESM bundle that uses named
        //   imports from @sentry/react, which is CJS. Node's native ESM loader
        //   cannot resolve CJS named exports via static import syntax.
        inline: [/@testing-library\/jest-dom/, /@openstax\/ui-components/],
      },
    },
    coverage: {
      reporter: ['text-summary', 'html', 'lcovonly'],
      include: ['src/*/**/*.{js,ts,tsx}'],
    },
  },
});

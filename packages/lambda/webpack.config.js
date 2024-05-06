/* spell-checker: ignore Builtins */
const fs = require('fs');
const path = require('path');
const {assertDefined} = require('@openstax/ts-utils/assertions');
const {ENV_BUILD_CONFIGS} = require('@openstax/ts-utils/config');
const nodeBuiltins = require('builtin-modules');
const webpack = require('webpack');

// we need to run the code to get the ENV configs, so build it now
// to make sure its up to date
require('child_process').execSync(
  './script/build.bash --clean',
  {stdio: 'inherit'}
);

const lambdaDir = 'build/src/functions';
const lambdaNames = fs.readdirSync(path.join(__dirname, lambdaDir));

const externals = ['aws-sdk', 'aws-crt']
  .concat(nodeBuiltins)
  .reduce((externalsMap, moduleName) => {
    externalsMap[moduleName] = moduleName;
    return externalsMap;
  }, {});

module.exports = lambdaNames.map(lambdaName => {
  const entry = path.join(__dirname, lambdaDir, `${lambdaName}/entry/lambda`)
  const services = path.join(__dirname, lambdaDir, `${lambdaName}/entry/lambda/services`)
  const routes = path.join(__dirname, lambdaDir, `${lambdaName}/core/routes`)

  // trying to cover as much as possible without actually wiring up the app
  // to catch all `envConfig` calls without trying to run them.
  require(services)

  // require routes if they exist
  if (fs.existsSync(routes)) { require(routes) }

  const env = ENV_BUILD_CONFIGS.splice(0, ENV_BUILD_CONFIGS.length);

  return {
    entry: ['source-map-support/register', entry],
    externals,

    output: {
      path: path.join(__dirname, 'dist', lambdaName),
      libraryTarget: 'commonjs',
      filename: 'index.js'
    },

    target: 'node',

    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: [], // include node modules
        }
      ]
    },

    resolve: {
      extensions: ['.ts', '.js'],
    },

    devtool: 'source-map',

    plugins: [
      new webpack.DefinePlugin({
        'typeof __PROCESS_ENV': JSON.stringify('object'),
        __PROCESS_ENV: JSON.stringify(Object.fromEntries(env.map(key => {
          return [key, assertDefined(process.env[key], `missing environment key ${key}`)]
        })))
      }),
      new webpack.ProgressPlugin(),
    ],
  }
});

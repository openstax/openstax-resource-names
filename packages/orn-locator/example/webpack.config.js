// webpack.config.js
module.exports = {
  entry: __dirname + '/../dist/index.js',
  output: {
    path: __dirname,
    filename: 'orn-locator.js',
    library: {
      type: 'umd',
      name: 'orn',
    },
    // prevent error: `Uncaught ReferenceError: self is not define`
    globalObject: 'this',
  }
};

// https://github.com/cloudflare/miniflare/issues/271#issuecomment-1255544333
//
// the uuid package says that it fixed this in v9 here https://github.com/uuidjs/uuid/pull/616#issuecomment-1237428554
// but i tired it and was still getting the error. try removing this hack in the future and
// see if it got figured out.
module.exports = (path, options) => {
  return options.defaultResolver(path, {
    ...options,
    packageFilter: pkg => {
      if (pkg.name === 'uuid') {
        delete pkg['exports'];
        delete pkg['module'];
      }
      return pkg;
    },
  });
};

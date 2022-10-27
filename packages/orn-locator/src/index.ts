import memoize from 'lodash/fp/memoize';
import * as pathToRegexp from 'path-to-regexp';
import { patterns } from './ornPatterns';

const compileMatcher = memoize((path: string) =>
  pathToRegexp.match<any>(path, {decode: decodeURIComponent})
);

export const locate = async (orn: string) => {

  for (const [path, resolver] of Object.entries(patterns)) {
    const match = compileMatcher(path)(orn);

    if (match) {
      return await resolver(match.params);
    }
  }

  return {type: 'not-found', orn} as const;
};

export const locateAll = (orn: string[]) => {
  return Promise.all(orn.map(locate));
};

export default {locate, locateAll};

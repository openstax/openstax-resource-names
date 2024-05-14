import { AnyResolvedOrn } from '../ornPatterns';

// Can't use AnyOrnLocateResponse here due to a circular dependency
export type OrnCacheStore = {
  getItem: (id: string) => Promise<AnyResolvedOrn>;
  putItem: (orn: AnyResolvedOrn) => Promise<void>;
};

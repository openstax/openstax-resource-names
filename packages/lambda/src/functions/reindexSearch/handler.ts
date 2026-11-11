import { Logger } from '@openstax/ts-utils/services/logger';
import { ReindexPage, ReindexResult } from '@openstax/ts-utils/services/searchProvider/reindexTarget';
import { makeReindexTargets, ReindexServices, ReindexTargets } from './targets';

export type ReindexEvent = ReindexPage & {
  target: keyof ReindexTargets;
};

/*
 * indexes one page of the target store per call, the caller drives pagination by
 * passing back the returned nextPageToken until it comes back undefined.
 */
export const reindexSearch = async(services: ReindexServices, logger: Logger, event: ReindexEvent): Promise<ReindexResult> => {
  const targets = makeReindexTargets(services);

  if (!Object.prototype.hasOwnProperty.call(targets, event.target)) {
    throw new Error(`unknown reindex target "${event.target}", expected one of: ${Object.keys(targets).join(', ')}`);
  }
  // payloads are typed by hand, a string like "false" would be truthy and delete the index
  if (event.reset !== undefined && typeof event.reset !== 'boolean') {
    throw new Error(`reset must be a boolean, got ${JSON.stringify(event.reset)}`);
  }
  if (event.reset && event.pageToken) {
    throw new Error('reset can only be used when starting a reindex, not with a pageToken');
  }

  return targets[event.target](logger, event);
};

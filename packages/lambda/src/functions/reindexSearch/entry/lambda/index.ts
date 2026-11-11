import { createConsoleLogger } from '@openstax/ts-utils/services/logger/console';
import { ReindexEvent, reindexSearch } from '../../handler';
import { lambdaServices } from './services';

/*
 * invoke once per page, passing the returned nextPageToken back in as pageToken until it is undefined.
 *
 * a non-zero failed count means some documents on that page weren't indexed, the errors are in the logs.
 * it's safe to reindex a page more than once, so a page may be retried by invoking again with the same
 * pageToken, but some errors will fail every time, so it's usually better to finish the rest of the table first.
 *
 * aws lambda invoke --function-name <stack>-reindex-search-lambda \
 *   --cli-binary-format raw-in-base64-out --payload '{"target": "exampleDocument", "reset": true}' /dev/stdout
 */
export const handler = async(event: ReindexEvent) => {
  return reindexSearch(lambdaServices, createConsoleLogger(), event);
};

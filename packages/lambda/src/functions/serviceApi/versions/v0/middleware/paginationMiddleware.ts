import { getKeyValueOr, putKeyValue } from '@openstax/ts-utils';
import { createPaginationMiddleware, loadMorePagination, pageNumberPagination } from '@openstax/ts-utils/pagination';
import { ApiRouteRequest } from '../../../core';

const getQueryParams = getKeyValueOr('queryStringParameters', {} as NonNullable<ApiRouteRequest['queryStringParameters']>);
const setUnusedQueryParams = putKeyValue('queryStringParameters');

export const loadMorePaginationMiddleware = createPaginationMiddleware<ApiRouteRequest>()({getQueryParams, setUnusedQueryParams, paginator: loadMorePagination});
export const pageNumberPaginationMiddleware = createPaginationMiddleware<ApiRouteRequest>()({getQueryParams, setUnusedQueryParams, paginator: pageNumberPagination});

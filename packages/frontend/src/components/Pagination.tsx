import React from 'react';
import * as UI from '@openstax/ui-components';
import { useQuery } from 'routing/useQuery';
import queryString from 'query-string';
import { useRouteLinkOnClick } from 'routing/components/RouteLink';

export const Pagination = (props: {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
}) => {
  const query = useQuery();
  const navigate = useRouteLinkOnClick();

  return <UI.Pagination
    {...props} showFromEnd={1} showFromCurrent={1}
    Page={({ page, current }) => {
      return <UI.LinkForPage
        page={page} current={current}
        href={"?" + queryString.stringify({ ...query, page })}
        onClick={navigate}
      />;
    }}
  />;
};

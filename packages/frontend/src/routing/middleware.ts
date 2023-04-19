import queryString from 'query-string';
import { AppServices } from "../core/types";

export const getQuery = ({history}: AppServices) => {
  return queryString.parse(history.location.search);
};

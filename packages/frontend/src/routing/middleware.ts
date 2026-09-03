import { parse } from "@openstax/ts-utils/misc/queryString";
import { AppServices } from "../core/types";

export const getQuery = ({history}: AppServices) => {
  return parse(history.location.search);
};

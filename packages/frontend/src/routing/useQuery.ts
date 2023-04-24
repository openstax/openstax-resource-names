import React from 'react';
import { useServices } from "../core/context/services";
import { getQuery } from "./middleware";

export const useQuery = () => {
  const services = useServices();
  const [query, setQuery] = React.useState(getQuery(services));

  React.useEffect(() => 
    services.history.listen(() => setQuery(getQuery(services)))
  , [services, setQuery]);

  return query;
};

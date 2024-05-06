import { createApiGateway } from "@openstax/ts-utils/services/apiGateway";
import { createUserRoleValidator } from "@openstax/ts-utils/services/authProvider/utils/userRoleValidator";
import { ErrorBoundary } from "@openstax/ui-components";
import { createBrowserHistory, Location } from "history";
import React from 'react';
import ReactDOM from 'react-dom';
import { createAuthProvider } from "./auth/authProvider";
import { frontendConfigProvider } from "./configProvider";
import { getRequestResponder } from "./core";
import { serviceProviderMiddleware } from "./core/context/services";
import { composeResponseServiceMiddleware } from "./core/services";
import './index.css';

/*
 * the use of the service container pattern in an app that only
 * has one entry point is pretty academic. it might become relevant
 * if you had some external dependencies the FE accessed directly
 * that you wanted to use a fake driver for in dev (or something like that)
 */
const makeApiGateway = createApiGateway({fetch: fetch.bind(window)});
const configProvider = frontendConfigProvider(makeApiGateway);
const authProvider = createAuthProvider({window})(configProvider);
const services = {
  authProvider,
  roleValidator: createUserRoleValidator(authProvider, {application: () => configProvider.getValue('roleApplication')}),
  history: createBrowserHistory(),
  createApiGateway: makeApiGateway,
  configProvider,
};

export type BrowserServices = typeof services;

const handler = getRequestResponder(services, composeResponseServiceMiddleware(
  serviceProviderMiddleware,
));

const Router = () => {
  const [location, setLocation] = React.useState<Location>(services.history.location);

  React.useEffect(() => {
    return services.history.listen((locationChange) => {
      setLocation(locationChange.location);
    });
  }, []);

  return <>{handler(location)}</>;
};

ReactDOM.render(
  <React.StrictMode>
    <ErrorBoundary
      renderFallback
      // sentryDsn='https://examplePublicKey@o0.ingest.sentry.io/0'
    >
      <Router />
    </ErrorBoundary>
  </React.StrictMode>,
  document.getElementById('root')
);

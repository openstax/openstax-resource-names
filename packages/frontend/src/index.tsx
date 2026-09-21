import { createApiGateway } from "@openstax/ts-utils/services/apiGateway";
import { createUserRoleValidator } from "@openstax/ts-utils/services/authProvider/utils/userRoleValidator";
import { Level } from "@openstax/ts-utils/services/logger";
import { ErrorBoundary, createSentryLogger } from "@openstax/ui-components";
import { createBrowserHistory, Location } from "history";
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createApiClient } from "./api";
import { createAuthProvider } from "./auth/authProvider";
import { frontendConfigProvider } from "./configProvider";
import { makeSessionConfigProvider } from "./configProvider/useSessionConfig";
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
const logger = createSentryLogger();
const makeApiGateway = createApiGateway({fetch: fetch.bind(window)});
const configProvider = frontendConfigProvider(makeApiGateway);
const authProvider = createAuthProvider({window})(configProvider);
const apiClient = createApiClient(makeApiGateway, {authProvider, logger});
const sessionConfigProvider = makeSessionConfigProvider(apiClient);

const services = {
  authProvider,
  logger,
  roleValidator: createUserRoleValidator(authProvider, {application: () => configProvider.getValue('roleApplication')}),
  history: createBrowserHistory(),
  apiClient,
  configProvider,
  sessionConfigProvider,
};

export type BrowserServices = typeof services;

/*
 * gtm is served first party, from the /gtm/* behavior on our own cloudfront
 * distribution - see the GTM gateway resources in deploy/deployment.cfn.yml. it
 * loads cookieyes and every other external tag, so nothing else belongs in
 * index.html. the path is what identifies the container, so unlike the third party
 * snippet this one carries no id.
 */
sessionConfigProvider.getValue('disableAnalytics').then((disableAnalytics) => {
  if (disableAnalytics === false) {
    (function(w:any,d,s,l){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});const f=d.getElementsByTagName(s)[0],
    j=d.createElement(s) as HTMLScriptElement,dl=l!=='dataLayer'?'?l='+l:'';j.async=true;j.src=
    '/gtm/'+dl;f.parentNode?.insertBefore(j,f);
    })(window,document,'script','dataLayer');
  }
}).catch(() => {
  // not knowing the session means not loading analytics, which is the safe way to fail
  logger.log('could not load the session config', Level.Error);
});

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

const ErrorBoundaryComponent = () => {
  return (
    <ErrorBoundary
      // sentryDsn='https://examplePublicKey@o0.ingest.sentry.io/0'
    >
      <Router />
    </ErrorBoundary>
  );
};

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container #root not found');
}
createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundaryComponent />
  </React.StrictMode>
);

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

declare const window: Window & {dataLayer: unknown[]};

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
 * gtm injects third party tags (cookieyes, pulse insights, etc.) that ad blockers
 * and network filters commonly block. script load errors don't bubble, so this
 * listens in the capture phase. it has to be bound before gtm loads, load errors
 * that happen before a listener exists are not recorded anywhere. logged as a
 * breadcrumb, so it only shows up in sentry alongside a later error.
 */
window.addEventListener('error', (event) => {
  if (event.target instanceof HTMLScriptElement) {
    logger.logEvent(Level.Warn, {message: 'script failed to load', src: event.target.src});
  }
}, true);

/*
 * gtm is served first party, from the /gtm/* behavior on our own cloudfront
 * distribution - see the GTM gateway resources in deploy/deployment.cfn.yml. it
 * loads cookieyes and every other external tag, so nothing else belongs in
 * index.html. the path is what identifies the container, so unlike the third party
 * snippet this one carries no id.
 */
/*
 * GTM is also what normally loads event capture. When analytics are disabled (K12
 * students) but the school has a research agreement, event capture is loaded
 * directly instead, from the same place GTM loads it. helper.js only looks for
 * window.EventCapture (set by standalone.umd.js) once, when it runs, so
 * standalone.umd.js must run first; added scripts only run in order when not async.
 */
const loadEventCapture = (ramBase: string) => {
  for (const path of ['/quasar/standalone.umd.js', '/analytics/helper.js']) {
    const script = document.createElement('script');
    script.async = false;
    script.src = ramBase.replace(/\/+$/, '') + path;
    document.head.appendChild(script);
  }
};

sessionConfigProvider.getConfig().then(async({disableAnalytics, researchAgreementActive, organizationId}) => {
  // the analytics helper, whether GTM or event capture loads it, reads the organization when it loads
  if (organizationId) {
    window.dataLayer.push({'os.organization_id': organizationId});
  }

  if (disableAnalytics === false) {
    (function(w:any,d,s,l){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});const f=d.getElementsByTagName(s)[0],
    j=d.createElement(s) as HTMLScriptElement,dl=l!=='dataLayer'?'?l='+l:'';j.async=true;j.src=
    '/gtm/'+dl;f.parentNode?.insertBefore(j,f);
    })(window,document,'script','dataLayer');
  } else if (researchAgreementActive) {
    loadEventCapture(await configProvider.getValue('ramBase'));
  }
}).catch(() => {
  // not knowing the session means not loading analytics, which is the safe way to fail
  logger.log('could not load the analytics config', Level.Error);
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

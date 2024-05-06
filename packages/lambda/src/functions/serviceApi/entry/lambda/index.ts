/* spell-checker: ignore avif apng thbs KHTML */
import './https-xray';

import { APIGatewayProxyEventV2 } from 'aws-lambda/trigger/api-gateway-proxy';
import { getRequestResponder } from '../../core';
import { ApiRouteResponse } from '../../core/types';
import { lambdaMiddleware, lambdaServices } from './services';

/*
 * for posterity, the payload format looks like this
 * {
 *  version: '2.0',
 *  routeKey: '$default',
 *  rawPath: '/favicon.ico',
 *  rawQueryString: '',
 *  headers: {
 *    accept: 'image/avif,image/webp,image/apng,image/svg+xml;q=0.8',
 *    'accept-encoding': 'gzip, deflate, br',
 *    'accept-language': 'en-US,en;q=0.9',
 *    'content-length': '0',
 *    host: 'o8thbs5d45.execute-api.us-east-1.amazonaws.com',
 *    referer: 'https://o8thbs5d45.execute-api.us-east-1.amazonaws.com/api/foobar',
 *    'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="97", "Chromium";v="97"',
 *    'sec-ch-ua-mobile': '?0',
 *    'sec-ch-ua-platform': '"macOS"',
 *    'sec-fetch-dest': 'image',
 *    'sec-fetch-mode': 'no-cors',
 *    'sec-fetch-site': 'same-origin',
 *    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36',
 *    'x-amzn-trace-id': 'Root=1-6213f295-165a47a57d98e524555003ce',
 *    'x-forwarded-for': '100.37.48.117',
 *    'x-forwarded-port': '443',
 *    'x-forwarded-proto': 'https'
 *  },
 *  requestContext: {
 *    accountId: '373045849756',
 *    apiId: 'o8thbs5d45',
 *    domainName: 'o8thbs5d45.execute-api.us-east-1.amazonaws.com',
 *    domainPrefix: 'o8thbs5d45',
 *    http: {
 *      method: 'GET',
 *      path: '/favicon.ico',
 *      protocol: 'HTTP/1.1',
 *      sourceIp: '100.37.48.117',
 *      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36'
 *    },
 *    requestId: 'N6LXVhOjoAMEMkQ=',
 *    routeKey: '$default',
 *    stage: '$default',
 *    time: '21/Feb/2022:20:14:13 +0000',
 *    timeEpoch: 1645474453192
 *  },
 *  isBase64Encoded: false
 * }
 */

export const handler: (request: APIGatewayProxyEventV2) => Promise<ApiRouteResponse> =
  getRequestResponder(lambdaServices, lambdaMiddleware);

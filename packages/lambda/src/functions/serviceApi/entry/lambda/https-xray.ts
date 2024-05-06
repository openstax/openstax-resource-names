import { captureHTTPsGlobal } from 'aws-xray-sdk';

captureHTTPsGlobal(require('http'), true);
captureHTTPsGlobal(require('https'), true);

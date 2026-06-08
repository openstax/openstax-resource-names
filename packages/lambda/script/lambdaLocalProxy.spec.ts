import http from 'http';
import request from 'supertest';
import * as requestModule from '../src/functions/serviceApi/core/request';
// @ts-ignore-next-line
import proxy from './lambdaLocalProxy.js';

type Middleware = (req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => void;

function createApp() {
  const stack: Middleware[] = [];
  const handler: http.RequestListener = (req, res) => {
    let i = 0;
    const next = () => { const fn = stack[i++]; if (fn) fn(req, res, next); };
    next();
  };
  // Terminal handler — ends the response if nothing else did (like Express's default 404)
  stack.push((_req, res) => { res.statusCode = 404; res.end(); });

  return Object.assign(handler, {
    use: (...args: [Middleware] | [string, Middleware]) => {
      // Insert before the terminal handler
      const pos = stack.length - 1;
      if (typeof args[0] === 'string') {
        const [prefix, fn] = args as [string, Middleware];
        stack.splice(pos, 0, (req, res, next) =>
          req.url?.startsWith(prefix) ? fn(req, res, next) : next()
        );
      } else {
        stack.splice(pos, 0, args[0]);
      }
    },
  });
}

describe('proxy', () => {
  let getRequestResponderSpy: jest.SpyInstance;
  let requestResponderSpy: jest.SpyInstance;

  beforeEach(() => {
    getRequestResponderSpy = jest.spyOn(requestModule, 'getRequestResponder');
    requestResponderSpy = jest.fn(() => undefined);
    getRequestResponderSpy.mockReturnValue(requestResponderSpy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('passes request to app responder', async() => {
    const app = createApp();
    proxy(app, 'serviceApi');

    await request(app).post('/api/path/asdf')
      .send({ foobar: 'body' })
      .set('neatHeader', 'headerValue')
    ;

    expect(requestResponderSpy).toHaveBeenCalledWith(expect.objectContaining({
      requestContext: {
        http: {
          method: 'POST',
          path: '/api/path/asdf',
        }
      },
      body: Buffer.from(JSON.stringify({ foobar: 'body' }), 'utf8'),
      headers: expect.objectContaining({ neatheader: 'headerValue' }), // spell-checker:disable-line
    }));
  });

  it('passes cookie to app responder', async() => {
    const app = createApp();
    proxy(app, 'serviceApi');

    await request(app).get('/api/path/asdf').send()
      .set('neatHeader', 'headerValue')
      .set('cookie', 'one=cookie-one; two=cookie-two')
    ;

    expect(requestResponderSpy).toHaveBeenCalledWith(expect.objectContaining({
      cookies: [
        'one=cookie-one',
        'two=cookie-two'
      ],
    }));
  });

  it('passes query params to app responder', async() => {
    const app = createApp();
    proxy(app, 'serviceApi');

    await request(app).get('/api/path/asdf?param1=value1').send()
      .set('neatHeader', 'headerValue')
      .set('cookie', 'one=cookie-one; two=cookie-two')
    ;

    expect(requestResponderSpy).toHaveBeenCalledWith(expect.objectContaining({
      queryStringParameters: {
        param1: 'value1'
      }
    }));
  });

  it('passes multi value query params to app responder', async() => {
    const app = createApp();
    proxy(app, 'serviceApi');

    await request(app).get('/api/path/asdf?param1=value1&param1=value2').send()
      .set('neatHeader', 'headerValue')
      .set('cookie', 'one=cookie-one; two=cookie-two')
    ;

    expect(requestResponderSpy).toHaveBeenCalledWith(expect.objectContaining({
      queryStringParameters: {
        param1: 'value1,value2'
      }
    }));
  });

  it('passes through when app has no response', async() => {
    const app = createApp();
    proxy(app, 'serviceApi');

    const fallback = jest.fn((_req: http.IncomingMessage, res: http.ServerResponse) => {
      res.end('hello');
    });
    app.use(fallback);

    await request(app).get('/api/path/asdf?param1=value1').send()
      .set('neatHeader', 'headerValue')
      .set('cookie', 'one=cookie-one; two=cookie-two')
    ;

    expect(fallback).toHaveBeenCalled();
  });

  it('skips non-matching paths', async() => {
    const app = createApp();
    proxy(app, 'serviceApi');

    const fallback = jest.fn((_req: http.IncomingMessage, res: http.ServerResponse) => {
      res.end('fallback');
    });
    app.use(fallback);

    await request(app).get('/some/other/path').send()
      .expect(200, 'fallback')
    ;

    expect(requestResponderSpy).not.toHaveBeenCalled();
    expect(fallback).toHaveBeenCalled();
  });

  it('responds when app has response', async() => {
    const appResponse = {statusCode: 201, body: 'response' };
    requestResponderSpy.mockReturnValue(Promise.resolve(appResponse));

    const app = createApp();
    proxy(app, 'serviceApi');

    await request(app).get('/api/path/asdf').send()
      .expect(201, 'response');

    expect(requestResponderSpy).toHaveBeenCalled();
  });

  it('responds when app has encoded response', async() => {
    const appResponse = {statusCode: 200, body: Buffer.from('response').toString('base64'), isBase64Encoded: true};
    requestResponderSpy.mockReturnValue(Promise.resolve(appResponse));

    const app = createApp();
    proxy(app, 'serviceApi');

    await request(app).get('/api/path/asdf').send()
      .expect(200, 'response');

    expect(requestResponderSpy).toHaveBeenCalled();
  });

  it('works for empty path and queryString', async() => {
    const app = createApp();
    proxy(app, 'serviceApi');

    await request(app).get('');

    expect(requestResponderSpy).not.toHaveBeenCalled();
  });

  it('skips request when req.url is undefined', async() => {
    const testApp = createApp();
    testApp.use((req, _res, next) => { delete (req as any).url; next(); });
    proxy(testApp, 'serviceApi');

    const fallback = jest.fn((_req: http.IncomingMessage, res: http.ServerResponse) => {
      res.end('fallback');
    });
    testApp.use(fallback);

    await request(testApp).get('/api/test').expect(200, 'fallback');

    expect(requestResponderSpy).not.toHaveBeenCalled();
    expect(fallback).toHaveBeenCalled();
  });

  it('responds with headers when app response includes them', async() => {
    const appResponse = {
      statusCode: 200,
      body: 'ok',
      headers: {'x-custom': 'value', 'x-other': undefined},
    };
    requestResponderSpy.mockReturnValue(Promise.resolve(appResponse));

    const app = createApp();
    proxy(app, 'serviceApi');

    const res = await request(app).get('/api/path/asdf').send();

    expect(res.status).toBe(200);
    expect(res.headers['x-custom']).toBe('value');
    expect(res.headers).not.toHaveProperty('x-other');
  });
});

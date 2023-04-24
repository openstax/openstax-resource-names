import express, {Request, Response} from 'express';
import request from 'supertest';
import * as requestModule from '../src/functions/serviceApi/core/request';
// @ts-ignore-next-line
import proxy from './lambdaLocalProxy.js';

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
    const app = express();
    proxy(app, 'serviceApi');

    await request(app).post('/asdf/path/asdf')
      .send({ foobar: 'body' })
      .set('neatHeader', 'headerValue')
    ;

    expect(requestResponderSpy).toHaveBeenCalledWith(expect.objectContaining({
      requestContext: {
        http: {
          method: 'POST',
          path: '/asdf/path/asdf',
        }
      },
      body: Buffer.from(JSON.stringify({ foobar: 'body' }), 'utf8'),
      headers: expect.objectContaining({ neatheader: 'headerValue' }), // cspell:disable-line
    }));
  });

  it('passes cookie to app responder', async() => {
    const app = express();
    proxy(app, 'serviceApi');

    await request(app).get('/asdf/path/asdf').send()
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
    const app = express();
    proxy(app, 'serviceApi');

    await request(app).get('/asdf/path/asdf?param1=value1').send()
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
    const app = express();
    proxy(app, 'serviceApi');

    await request(app).get('/asdf/path/asdf?param1=value1&param1=value2').send()
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
    const app = express();
    proxy(app, 'serviceApi');

    const fallback = jest.fn((_req: Request, res: Response) => res.send('hello'));
    app.all('*', fallback);

    await request(app).get('/asdf/path/asdf?param1=value1').send()
      .set('neatHeader', 'headerValue')
      .set('cookie', 'one=cookie-one; two=cookie-two')
    ;

    expect(fallback).toHaveBeenCalled();
  });


  it('responds when app has response', async() => {
    const appResponse = {statusCode: 201, body: 'response' };
    requestResponderSpy.mockReturnValue(Promise.resolve(appResponse));

    const app = express();
    proxy(app, 'serviceApi');

    await request(app).get('/asdf/path/asdf').send()
      .expect(201, 'response');

    expect(requestResponderSpy).toHaveBeenCalled();
  });
});

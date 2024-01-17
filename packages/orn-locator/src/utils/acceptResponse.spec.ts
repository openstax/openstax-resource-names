import { InvalidRequestError, NotFoundError, UnauthorizedError } from '@openstax/ts-utils/errors';
import { acceptResponse } from './acceptResponse';

describe('acceptResponse', () => {
  it('returns the response if the status code is in the allow list', async() => {
    const okResponse = { status: 200, text: async() => 'OK' };
    expect(await acceptResponse(okResponse)).toBe(okResponse);

    const createdResponse = { status: 201, text: async() => 'Created' };
    expect(await acceptResponse(createdResponse, [201])).toBe(createdResponse);
  });

  it('throws InvalidRequestError if the status code is 400', async() => {
    const rejectedPromise = acceptResponse({ status: 400, text: async() => 'Invalid' });
    await expect(rejectedPromise).rejects.toThrow(InvalidRequestError);
    await expect(rejectedPromise).rejects.toThrow('Invalid');
  });

  it('throws UnauthorizedError if the status code is 401', async() => {
    const rejectedPromise = acceptResponse({ status: 401, text: async() => 'Unauthorized' });
    await expect(rejectedPromise).rejects.toThrow(UnauthorizedError);
    await expect(rejectedPromise).rejects.toThrow('Unauthorized');
  });

  it('throws NotFoundError if the status code is 404', async() => {
    const rejectedPromise = acceptResponse({ status: 404, text: async() => 'Not Found' });
    await expect(rejectedPromise).rejects.toThrow(NotFoundError);
    await expect(rejectedPromise).rejects.toThrow('Not Found');
  });

  it('throws Error if the status code is something else not expected', async() => {
    const rejectedPromise1 = acceptResponse({ status: 200, text: async() => 'OK' }, [201]);
    await expect(rejectedPromise1).rejects.toThrow(Error);
    await expect(rejectedPromise1).rejects.toThrow('OK');

    const rejectedPromise2 = acceptResponse({ status: 201, text: async() => 'Created' });
    await expect(rejectedPromise2).rejects.toThrow(Error);
    await expect(rejectedPromise2).rejects.toThrow('Created');
  });
});

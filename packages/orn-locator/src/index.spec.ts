import { Response } from 'node-fetch';
import { locate, locateAll } from '.';

let originalFetch: typeof global.fetch;

beforeAll(() => {
  originalFetch = global.fetch;
  global.fetch = jest.fn().mockImplementation((url: string) => {
    const responseItem = {orn: 'https://openstax.org/orn/test', type: 'not-found'};
    const response = url.includes('/api/v0/orn-lookup') ? { items: [ responseItem ] } : responseItem;

    return Promise.resolve(new Response(JSON.stringify(response)));
  });
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('locateAll', () => {
  it('works', async() => {
    expect(await locateAll(['https://openstax.org/orn/test'])).toMatchInlineSnapshot(`
[
  {
    "orn": "https://openstax.org/orn/test",
    "type": "not-found",
  },
]
`);
  });
});

describe('locate', () => {
  it('works', async() => {
    expect(await locate('https://openstax.org/orn/test')).toMatchInlineSnapshot(`
{
  "orn": "https://openstax.org/orn/test",
  "type": "not-found",
}
`);
  });
});

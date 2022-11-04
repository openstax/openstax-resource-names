import { locate, locateAll } from '.';

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

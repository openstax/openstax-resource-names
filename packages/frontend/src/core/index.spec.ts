import { routes } from ".";

describe('gets routes', () => {
  it('doesn\'t error', () => {
    expect(routes).not.toThrow();
  });
});

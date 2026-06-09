jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn(),
}));

describe('generateRouteData', () => {
  it('writes routeData.json without error', () => {
    const fs = require('fs');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    expect(() => require('./generateRouteData')).not.toThrow();
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync.mock.calls[0][0]).toMatch(/routeData\.json$/);
    expect(consoleSpy).toHaveBeenCalledWith('routeData.json updated');

    consoleSpy.mockRestore();
  });
});

export default null;

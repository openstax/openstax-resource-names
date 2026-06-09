describe('getRouteData', () => {
  it('generates route data', () => {
    const { getApiRouteData } = require('./getRouteData');
    const routeData = getApiRouteData('serviceApi');
    expect(routeData).toBeDefined();
    expect(Object.keys(routeData).length).toBeGreaterThan(0);
    for (const route of Object.values(routeData) as any[]) {
      expect(route).toHaveProperty('path');
      expect(route).toHaveProperty('method');
    }
  });
});

 
export default null;

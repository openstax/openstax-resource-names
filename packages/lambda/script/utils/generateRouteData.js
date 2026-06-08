const fs = require('fs');
const path = require('path');
const { getApiRouteData } = require('../../build/script/utils/getRouteData');

const routeData = getApiRouteData('serviceApi');
const outPath = path.resolve(__dirname, '../../build/routeData.json');
fs.writeFileSync(outPath, JSON.stringify(routeData, null, 2));
console.log('routeData.json updated');

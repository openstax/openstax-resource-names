import fs from 'fs';
import path from 'path';
import { getApiRouteData } from './getRouteData';

const routeData = getApiRouteData('serviceApi');
const outPath = path.resolve(__dirname, '../../routeData.json');
fs.writeFileSync(outPath, JSON.stringify(routeData, null, 2));
console.log('routeData.json updated');

import { OpenapiIntegrator } from './openapi.integrator';

export default OpenapiIntegrator;
Object.assign(module.exports, OpenapiIntegrator);

// Testing section
import { readFileSync } from 'fs';
const data = readFileSync('./example/openapi_sample.json').toString();
const oai = new OpenapiIntegrator(JSON.parse(data));
oai.addIntegration().then().catch(err => console.error('error: ', err));
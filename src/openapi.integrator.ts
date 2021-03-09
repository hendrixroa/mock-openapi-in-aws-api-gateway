import * as SwaggerParser from "@apidevtools/swagger-parser";
import * as jsf from 'json-schema-faker';
import * as faker from 'faker';
import { writeFileSync } from 'fs';

jsf.option({
  alwaysFakeOptionals: true,
  defaultRandExpMax: 20,
  useExamplesValue: true,
  optionalsProbability: 1,
});
jsf.format('binary', () => null);
jsf.format('uuid', () => faker.random.uuid());
jsf.extend('faker', () => faker);

export class OpenapiIntegrator {
  private readonly apiSpec: any;

  constructor(apiSpec: any) {
    this.apiSpec = apiSpec;
  }

  public async addIntegration(): Promise<any> {
    await this.validateOpenapiSpec();
    let apiSpecMutable: any = this.apiSpec;

    for(const path in apiSpecMutable.paths) {
      for (const method in apiSpecMutable.paths[path]) {
        const responseSchema = apiSpecMutable.paths[path][method].responses;
        const objIntegration = await this.addIntegrationObject(responseSchema);
        apiSpecMutable.paths[path][method][
          'x-amazon-apigateway-integration'
          ] = objIntegration;
        apiSpecMutable.paths[path].options = this.addIntegrationCORS();
      }
    }
    writeFileSync('out.json', JSON.stringify(apiSpecMutable));
    return apiSpecMutable;
  }

  private async addIntegrationObject(responsesSchema: any) {
    let objResponses: any = {};
    for(const response in responsesSchema) {
      if(responsesSchema[response].hasOwnProperty('content')) {
        const schema = responsesSchema[response].content['application/json'].schema;
        console.log('schema: ', schema);
        const dataFromSchema = await jsf.resolve(schema);

        objResponses.responses = {
           "default": {
            "statusCode": response,
            "responseTemplates": {
              "application/json": JSON.stringify(dataFromSchema),
            }
          }
        }
      }
    }
    return {
      ...objResponses,
      "requestTemplates": {
        "application/json": "{\"statusCode\": 200}"
      },
      "passthroughBehavior": "when_no_match",
      "type": "mock"
    };
  }

  private addIntegrationCORS() {
    return {
      description: 'Enable CORS by returning correct headers\n',
      responses: {
        200: {
          description: 'Default response for CORS method',
          headers: {
            'Access-Control-Allow-Headers': {
              schema: {
                type: 'string',
              },
            },
            'Access-Control-Allow-Methods': {
              schema: {
                type: 'string',
              },
            },
            'Access-Control-Allow-Origin': {
              schema: {
                type: 'string',
              },
            },
          },
          content: {},
        },
      },
      summary: 'CORS support',
      tags: ['CORS'],
      'x-amazon-apigateway-integration': {
        requestTemplates: {
          'application/json': '{\n  "statusCode" : 200\n}\n',
        },
        responses: {
          default: {
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers':
                "'*'",
              'method.response.header.Access-Control-Allow-Methods': "'*'",
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
            responseTemplates: {
              'application/json': '{}\n',
            },
            statusCode: '200',
          },
        },
        type: 'mock',
      },
    };
  }

  public async validateOpenapiSpec(): Promise<void> {
    try {
      await SwaggerParser.validate(this.apiSpec);
    }
    catch(err) {
      throw new Error('Invalid api spec: ' + err);
    }
  }
}
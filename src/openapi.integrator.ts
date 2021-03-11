import * as SwaggerParser from '@apidevtools/swagger-parser';
import * as jsf from 'json-schema-faker';
import * as faker from 'faker';

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
        apiSpecMutable.paths[path][method][
          'x-amazon-apigateway-request-validator'
          ] = "all";
      }
    }
    apiSpecMutable['x-amazon-apigateway-request-validators'] = this.getValidators();
    apiSpecMutable['x-amazon-apigateway-gateway-responses'] = this.getResponses();
    return apiSpecMutable;
  }

  private async addIntegrationObject(responsesSchema: any) {
    let objResponses: any = {};
    for(const response in responsesSchema) {
      const responseContent = responsesSchema[response]?.content;
      const responseContentAppJson = responseContent && responseContent.hasOwnProperty('application/json') ?
        responseContent['application/json'] : undefined;
      const schema = responseContent && responseContentAppJson && responseContentAppJson?.schema;
      let dataFromSchema = schema ? await jsf.resolve(schema) : undefined;

      objResponses.responses = {
        "default": {
          "statusCode": response,
        }
      };
      if(dataFromSchema) {
        objResponses.responses.default = {
          ...objResponses.responses.default,
          "responseTemplates": {
            "application/json": JSON.stringify(dataFromSchema),
          }
        };
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

  private getValidators() {
    return {
      "all": {
        "validateRequestBody": true,
        "validateRequestParameters": true
      },
      "params-only": {
        "validateRequestBody": false,
        "validateRequestParameters": true
      }
    };
  }

  private getResponses() {
    return {
      "BAD_REQUEST_BODY": {
        "statusCode": 400,
        "responseParameters": {
          "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
          "gatewayresponse.header.from-request-header" : "method.request.header.Accept"
        },
        "responseTemplates": {
          "application/json": "{\"message\":\"$context.error.validationErrorString\",\"errorType\":\"validation\"}"
        }
      },
      "BAD_REQUEST_PARAMETERS": {
        "statusCode": 400,
        "responseParameters": {
          "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
          "gatewayresponse.header.from-request-header" : "method.request.header.Accept"
        },
        "responseTemplates": {
          "application/json": "{\"message\":\"$context.error.validationErrorString\",\"errorType\":\"validation\"}"
        }
      }
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
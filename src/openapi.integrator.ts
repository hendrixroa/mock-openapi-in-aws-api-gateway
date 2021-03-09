import * as SwaggerParser from "@apidevtools/swagger-parser";
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

  public async addIntegration() {
    await this.validateOpenapiSpec();
    let apiSpecMutable: any = this.apiSpec;

    for(const path in apiSpecMutable.paths) {
      for (const method in apiSpecMutable.paths[path]) {
        const responseSchema = apiSpecMutable.paths[path][method].responses;
        const objIntegration = await this.addIntegrationObject(responseSchema);
        console.log('path: ', path);
        console.log('method: ', method);
        console.log('objInt: ', JSON.stringify(objIntegration));
      }
    }

  }

  private async addIntegrationObject(responsesSchema: any) {
    let objResponses: any = {};
    for(const response in responsesSchema) {
      if(responsesSchema[response].hasOwnProperty('content')) {
        const schema = responsesSchema[response].content['application/json'].schema;
        console.log('schema: ', schema);
        const dataFromSchema = await jsf.resolve(schema);

        objResponses.responses = {
          [response]: {
            "statusCode": response,
            "responseTemplates": {
              "application/json": dataFromSchema
            }
          }
        }
      }
    }
    return {
      "responses": objResponses,
      "requestTemplates": {
        "application/json": "{\"statusCode\": 200}"
      },
      "passthroughBehavior": "when_no_match",
      "type": "mock"
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
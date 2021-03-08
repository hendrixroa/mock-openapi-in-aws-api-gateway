import * as SwaggerParser from "@apidevtools/swagger-parser";
import * as jsf from 'json-schema-faker';
import * as faker from 'faker';

jsf.format('binary', () => null);
jsf.format('uuid', () => faker.random.uuid());

export class OpenapiIntegrator {
  private readonly apiSpec: any;

  constructor(apiSpec: any) {
    this.apiSpec = apiSpec;
  }

  public async addIntegration() {
    await this.validateOpenapiSpec();
    let apiSpecMutable: any = this.apiSpec;
    const components = apiSpecMutable.components;
    const data = await jsf.resolve(components.schemas);

    console.log('data: ', data);

    Object.keys(apiSpecMutable.paths).map((path: string) => {
      Object.keys(apiSpecMutable.paths[path]).map((method: string) => {

      });
    });
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
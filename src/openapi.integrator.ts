import SwaggerParser from "@apidevtools/swagger-parser";

export class OpenapiIntegrator {
  private readonly apiSpec: any;

  constructor(apiSpec: any) {
    this.apiSpec = apiSpec;
  }

  public async addIntegration() {
    await this.validateOpenapiSpec();
    let apiSpecMutable: any = this.apiSpec;

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
      throw new Error('Invalid api spec');
    }
  }
}
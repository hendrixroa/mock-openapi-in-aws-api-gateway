# Mock openapi in AWS API Gateway
This is another openapi (a.k.a swagger) mock server builder file to take advantage of AWS API Gateway free tier.

## Install
```bash
yarn add mock-openapi-in-aws-api-gateway
# or npm install --sage mock-openapi-in-aws-api-gateway
```

## Usage
```typescript
import mockOpenapi from 'mock-openapi-in-aws-api-gateway';
const openapiSpecInJson = {...};
const instance = mockOpenapi(openapiSpecInJson);
const result = await instance.addIntegration();
```


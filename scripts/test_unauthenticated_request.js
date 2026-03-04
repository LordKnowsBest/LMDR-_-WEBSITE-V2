import { handleGatewayRequest } from '../src/backend/apiGateway.jsw';

async function run() {
  const request = {
    method: 'GET',
    path: '/v1/parking/search',
    headers: {
      get: (name) => {
        if (name.toLowerCase() === 'user-agent') return 'test-agent';
        return null;
      }
    }
  };

  const response = await handleGatewayRequest(request);
  console.log(`Status: ${response.status}`);
  console.log(`Body:`, response.body);
}

// We can't easily run it directly because of import paths ('backend/dataAccess')
// But we can check if it returns 401
console.log('Test created, but to run it we need to mock dependencies.');

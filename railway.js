const fetch = require('node-fetch');

const RAILWAY_API_URL = 'https://backboard.railway.app/graphql/v2';

async function railwayRequest(query, variables) {
  const res = await fetch(RAILWAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RAILWAY_API_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  return json.data;
}

async function redeployService() {
  const query = `
    mutation ServiceInstanceRedeploy($serviceId: String!, $environmentId: String!) {
      serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
    }
  `;
  const variables = {
    serviceId: process.env.RAILWAY_SERVICE_ID,
    environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
  };
  const data = await railwayRequest(query, variables);
  return data.serviceInstanceRedeploy;
}

async function restartService() {
  const query = `
    mutation ServiceInstanceRestart($serviceId: String!, $environmentId: String!) {
      serviceInstanceRestart(serviceId: $serviceId, environmentId: $environmentId)
    }
  `;
  const variables = {
    serviceId: process.env.RAILWAY_SERVICE_ID,
    environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
  };
  const data = await railwayRequest(query, variables);
  return data.serviceInstanceRestart;
}

async function getLatestDeploymentStatus() {
  const query = `
    query Deployments($serviceId: String!, $environmentId: String!) {
      deployments(
        input: { serviceId: $serviceId, environmentId: $environmentId }
        first: 1
      ) {
        edges {
          node {
            id
            status
            createdAt
            staticUrl
          }
        }
      }
    }
  `;
  const variables = {
    serviceId: process.env.RAILWAY_SERVICE_ID,
    environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
  };
  const data = await railwayRequest(query, variables);
  return data.deployments.edges[0]?.node || null;
}

module.exports = {
  redeployService,
  restartService,
  getLatestDeploymentStatus,
};

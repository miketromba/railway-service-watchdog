const RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2";

interface DeploymentNode {
  id: string;
  status: string;
}

interface DeploymentsResponse {
  data: {
    deployments: {
      edges: Array<{ node: DeploymentNode }>;
    };
  };
  errors?: Array<{ message: string }>;
}

interface RestartResponse {
  data: {
    deploymentRestart: boolean;
  };
  errors?: Array<{ message: string }>;
}

async function graphqlRequest<T>(
  token: string,
  query: string,
  variables: Record<string, string>,
): Promise<T> {
  const response = await fetch(RAILWAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Railway API returned ${response.status}: ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function getActiveDeployment(
  token: string,
  projectId: string,
  serviceId: string,
  environmentId: string,
): Promise<string | null> {
  const query = `
    query deployments($projectId: String!, $serviceId: String!, $environmentId: String!) {
      deployments(
        first: 1
        input: {
          projectId: $projectId
          serviceId: $serviceId
          environmentId: $environmentId
          status: { in: [SUCCESS] }
        }
      ) {
        edges {
          node {
            id
            status
          }
        }
      }
    }
  `;

  const result = await graphqlRequest<DeploymentsResponse>(token, query, {
    projectId,
    serviceId,
    environmentId,
  });

  if (result.errors && result.errors.length > 0) {
    throw new Error(`GraphQL error: ${result.errors[0]!.message}`);
  }

  const edge = result.data.deployments.edges[0];
  return edge?.node.id ?? null;
}

export async function restartDeployment(
  token: string,
  deploymentId: string,
): Promise<boolean> {
  const query = `
    mutation deploymentRestart($deploymentId: String!) {
      deploymentRestart(id: $deploymentId)
    }
  `;

  const result = await graphqlRequest<RestartResponse>(token, query, {
    deploymentId,
  });

  if (result.errors && result.errors.length > 0) {
    throw new Error(`GraphQL error: ${result.errors[0]!.message}`);
  }

  return result.data.deploymentRestart;
}

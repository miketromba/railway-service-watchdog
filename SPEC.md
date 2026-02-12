You are a Senior Engineer building a new open-source utility from scratch: a lightweight service that periodically restarts Railway deployments on a cron schedule.

## Context

Railway is a PaaS with no built-in way to schedule periodic service restarts. This is needed because Bun (the JS runtime) has known memory leaks in long-running servers (GitHub oven-sh/bun#18488, oven-sh/bun#21560). A weekly restart keeps memory in check.

## Requirements

### Repository Setup
- Name: `railway-service-watchdog`
- Public GitHub repo
- MIT license
- Written in TypeScript, runs on Node.js (NOT Bun — this monitors Bun services)
- Use Bun as the package manager, Node.js as the runtime
- Minimal dependencies: `node-cron`, `tsx`, `typescript`, `@types/node`, `@types/node-cron`
- Include a `Dockerfile` and `railway.json`

### What It Does

On a cron schedule, for each configured service ID:
1. Query Railway GraphQL API for the latest active deployment
2. Call `deploymentRestart` to restart it
3. Log the action with a timestamp

That's it. Nothing else.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RAILWAY_API_TOKEN` | Yes | — | Railway account or workspace token |
| `PROJECT_ID` | Yes | — | Railway project ID |
| `ENVIRONMENT_ID` | Yes | — | Railway environment ID |
| `SERVICE_IDS` | Yes | — | Comma-separated service IDs to restart |
| `RESTART_SCHEDULE` | No | `0 4 * * 0` | Cron expression (default: Sunday 4 AM UTC) |

### Railway GraphQL API

**Endpoint:** `https://backboard.railway.com/graphql/v2`
**Auth:** `Authorization: Bearer ${RAILWAY_API_TOKEN}`

**Get latest active deployment:**
```graphql
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
```

**Restart a deployment:**
```graphql
mutation deploymentRestart($deploymentId: String!) {
  deploymentRestart(id: $deploymentId)
}
```

### Code Structure

```
railway-service-watchdog/
├── src/
│   ├── index.ts          # Entry point: validate env, start cron
│   └── railway-api.ts    # GraphQL client: getActiveDeployment, restartDeployment
├── Dockerfile
├── railway.json
├── package.json
├── tsconfig.json
├── LICENSE
├── README.md
└── .gitignore
```

### Dockerfile

```dockerfile
FROM oven/bun:1-alpine AS installer
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM node:22-alpine
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY . .
CMD ["npx", "tsx", "src/index.ts"]
```

### railway.json

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Code Quality
- Strict TypeScript, no `any`
- Never crash on API failures — log and continue
- Timestamped logs: `[2026-02-12T04:00:00Z] Restarting service abc123...`
- Validate required env vars at startup, exit with clear error if missing

### README.md
1. One-line description
2. "Deploy on Railway" button (placeholder URL)
3. Environment variables table
4. How to find service IDs (Cmd+K in Railway dashboard)
5. Cron expression examples
6. MIT license badge

## Execution Steps

1. Create project directory, `bun init`
2. `bun add node-cron tsx typescript @types/node @types/node-cron`
3. Write source files, Dockerfile, railway.json, .gitignore, LICENSE (MIT), README
4. Init git, create public GitHub repo `railway-service-watchdog`, push
5. Verify repo is public and README renders

## Constraints
- Total source code should be well under 200 lines
- Zero unnecessary dependencies or features
- Node.js runtime, Bun package manager
- ES modules only, no CommonJS
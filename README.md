# railway-service-watchdog

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Lightweight service that periodically restarts Railway deployments on a cron schedule.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/XXXXX)

## Why?

Bun has known memory leaks in long-running servers ([#18488](https://github.com/oven-sh/bun/issues/18488), [#21560](https://github.com/oven-sh/bun/issues/21560)). A scheduled restart keeps memory in check. Railway doesn't have a built-in way to do this — so this service handles it.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RAILWAY_API_TOKEN` | Yes | — | Railway account or workspace token |
| `PROJECT_ID` | Yes | — | Railway project ID |
| `ENVIRONMENT_ID` | Yes | — | Railway environment ID |
| `SERVICE_IDS` | Yes | — | Comma-separated service IDs to restart |
| `RESTART_SCHEDULE` | No | `0 4 * * 0` | Cron expression (default: Sunday 4 AM UTC) |

## Finding Service IDs

In the Railway dashboard, press **Cmd+K** (or **Ctrl+K**) and search for your service. The service ID is visible in the URL:

```
https://railway.com/project/<PROJECT_ID>/service/<SERVICE_ID>
```

## Cron Expression Examples

| Expression | Schedule |
|------------|----------|
| `0 4 * * 0` | Every Sunday at 4:00 AM UTC |
| `0 4 * * *` | Every day at 4:00 AM UTC |
| `0 */6 * * *` | Every 6 hours |
| `0 4 * * 1,4` | Monday and Thursday at 4:00 AM UTC |

## License

MIT

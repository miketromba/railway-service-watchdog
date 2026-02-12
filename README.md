# railway-service-watchdog

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Schedule automatic restarts for your Railway services. Runs as a lightweight sidecar inside your Railway project.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/XXXXX)

## Why?

Railway doesn't have a built-in way to schedule periodic service restarts. But there are plenty of reasons you might need one:

- **Memory leaks** — your runtime or application slowly leaks memory over days/weeks
- **Stale connections** — long-lived database or API connections go stale and stop recovering
- **Cache bloat** — in-memory caches grow unbounded without TTL eviction
- **Periodic refresh** — you want a clean slate on a known schedule (e.g. weekly, nightly)
- **Stability** — some services simply run better with a regular restart cadence

This service calls the Railway API on a cron schedule to restart one or more services automatically. Deploy it once, configure your schedule, and forget about it.

## How It Works

On each cron tick, for every configured service ID:

1. Queries the Railway GraphQL API for the latest active deployment
2. Calls `deploymentRestart` to restart it
3. Logs the result with a timestamp

That's it. ~180 lines of TypeScript total.

## Quick Start

1. Click the **Deploy on Railway** button above
2. Set your environment variables (see below)
3. Done — your services will restart on schedule

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RAILWAY_API_TOKEN` | Yes | — | Railway account or team token |
| `PROJECT_ID` | Yes | — | Railway project ID |
| `ENVIRONMENT_ID` | Yes | — | Railway environment ID |
| `SERVICE_IDS` | Yes | — | Comma-separated service IDs to restart |
| `RESTART_SCHEDULE` | No | `0 4 * * 0` | Cron expression (default: Sunday 4 AM UTC) |

## Finding Your IDs

In the Railway dashboard, press **Cmd+K** (or **Ctrl+K**) and search for your service. The project ID, service ID, and environment ID are all visible in the URL:

```
https://railway.com/project/<PROJECT_ID>/service/<SERVICE_ID>?environmentId=<ENVIRONMENT_ID>
```

## Cron Schedule Examples

| Expression | Schedule |
|------------|----------|
| `0 4 * * 0` | Every Sunday at 4:00 AM UTC |
| `0 4 * * *` | Every day at 4:00 AM UTC |
| `0 */6 * * *` | Every 6 hours |
| `0 4 * * 1,4` | Monday and Thursday at 4:00 AM UTC |
| `0 0 1 * *` | First day of every month at midnight UTC |

## How This Was Built

This entire project was generated from a single AI prompt. See [`PROMPT.md`](PROMPT.md) for the full specification that produced this codebase.

## License

MIT — see [LICENSE](LICENSE)

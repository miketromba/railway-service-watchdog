import cron from "node-cron";
import {
  getActiveDeployment,
  restartDeployment,
  type RailwayAuth,
} from "./railway-api.js";

function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`ERROR: Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

function resolveAuth(): RailwayAuth {
  const projectToken = process.env["RAILWAY_TOKEN"];
  if (projectToken) {
    return { kind: "project", token: projectToken };
  }
  const apiToken = process.env["RAILWAY_API_TOKEN"];
  if (apiToken) {
    return { kind: "bearer", token: apiToken };
  }
  console.error(
    "ERROR: Set RAILWAY_TOKEN (project token) or RAILWAY_API_TOKEN (account or team token)",
  );
  process.exit(1);
}

const RAILWAY_AUTH = resolveAuth();
const PROJECT_ID = requireEnv("PROJECT_ID");
const ENVIRONMENT_ID = requireEnv("ENVIRONMENT_ID");
const SERVICE_IDS = requireEnv("SERVICE_IDS")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);
const RESTART_SCHEDULE = process.env["RESTART_SCHEDULE"] ?? "0 4 * * 0";

if (SERVICE_IDS.length === 0) {
  console.error("ERROR: SERVICE_IDS must contain at least one service ID");
  process.exit(1);
}

if (!cron.validate(RESTART_SCHEDULE)) {
  console.error(`ERROR: Invalid cron expression: ${RESTART_SCHEDULE}`);
  process.exit(1);
}

async function restartServices(): Promise<void> {
  log(`Starting restart cycle for ${SERVICE_IDS.length} service(s)`);

  for (const serviceId of SERVICE_IDS) {
    try {
      log(`Fetching active deployment for service ${serviceId}...`);

      const deploymentId = await getActiveDeployment(
        RAILWAY_AUTH,
        PROJECT_ID,
        serviceId,
        ENVIRONMENT_ID,
      );

      if (!deploymentId) {
        log(`No active deployment found for service ${serviceId}, skipping`);
        continue;
      }

      log(`Restarting deployment ${deploymentId} for service ${serviceId}...`);
      await restartDeployment(RAILWAY_AUTH, deploymentId);
      log(`Successfully restarted service ${serviceId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to restart service ${serviceId}: ${message}`);
    }
  }

  log("Restart cycle complete");
}

// Check the token at startup so a revoked or under-scoped token fails the
// deploy now, instead of silently skipping the next scheduled restart.
async function verifyAccess(): Promise<void> {
  for (const serviceId of SERVICE_IDS) {
    try {
      const deploymentId = await getActiveDeployment(
        RAILWAY_AUTH,
        PROJECT_ID,
        serviceId,
        ENVIRONMENT_ID,
      );
      log(`Access OK for service ${serviceId} (active deployment: ${deploymentId ?? "none"})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`ERROR: Cannot read deployments for service ${serviceId}: ${message}`);
      process.exit(1);
    }
  }
}

log("Railway Service Watchdog started");
log(`Auth: ${RAILWAY_AUTH.kind === "project" ? "project token" : "account/team token"}`);
log(`Schedule: ${RESTART_SCHEDULE}`);
log(`Services: ${SERVICE_IDS.join(", ")}`);

await verifyAccess();

cron.schedule(RESTART_SCHEDULE, () => {
  void restartServices();
});

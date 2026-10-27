import cron from "node-cron";
import {
  getActiveDeployment,
  restartDeployment,
  type RailwayToken,
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

function requireToken(): RailwayToken {
  const project = process.env["RAILWAY_TOKEN"];
  if (project) return { project };
  const api = process.env["RAILWAY_API_TOKEN"];
  if (api) return { api };
  console.error(
    "ERROR: Set RAILWAY_TOKEN (a project token) or RAILWAY_API_TOKEN (an account or workspace token)",
  );
  process.exit(1);
}

const TOKEN = requireToken();
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
        TOKEN,
        PROJECT_ID,
        serviceId,
        ENVIRONMENT_ID,
      );

      if (!deploymentId) {
        log(`No active deployment found for service ${serviceId}, skipping`);
        continue;
      }

      log(`Restarting deployment ${deploymentId} for service ${serviceId}...`);
      await restartDeployment(TOKEN, deploymentId);
      log(`Successfully restarted service ${serviceId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to restart service ${serviceId}: ${message}`);
    }
  }

  log("Restart cycle complete");
}

log("Railway Service Watchdog started");
log(`Schedule: ${RESTART_SCHEDULE}`);
log(`Services: ${SERVICE_IDS.join(", ")}`);
log(
  `Token: ${"project" in TOKEN ? "project token (RAILWAY_TOKEN)" : "account or workspace token (RAILWAY_API_TOKEN)"}`,
);

cron.schedule(RESTART_SCHEDULE, () => {
  void restartServices();
});

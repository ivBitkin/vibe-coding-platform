import type { TriggerConfig } from "@trigger.dev/sdk";

export const config: TriggerConfig = {
  project: process.env.TRIGGER_DEV_PROJECT_ID || "proj_uqpebbentlpcqbxcrhim",
  maxDuration: 300, // 5 minutes max duration
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./trigger"],
};


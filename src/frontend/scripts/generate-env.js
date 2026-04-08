#!/usr/bin/env node
/**
 * generate-env.js
 *
 * Writes src/frontend/env.json with real values from Caffeine platform
 * environment variables BEFORE vite build runs.
 *
 * The Caffeine platform injects these at build time:
 *   CANISTER_ID_BACKEND   - the backend canister ID
 *   STORAGE_GATEWAY_URL   - the object-storage gateway URL (e.g. https://blob.caffeine.ai)
 *   II_URL                - Internet Identity URL
 *   DFX_NETWORK           - "local" | "ic"
 *   PROJECT_ID            - the Caffeine project UUID (used as project_id for storage)
 *
 * For project_id: Caffeine may inject it as PROJECT_ID or CANISTER_ID_BACKEND.
 * We try PROJECT_ID first, then CANISTER_ID_BACKEND as a fallback.
 *
 * IMPORTANT: Missing values are written as the string "undefined" (NOT "").
 * loadConfig() in @caffeineai/core-infrastructure checks:
 *   config.project_id !== "undefined"           → if "undefined", uses DEFAULT_PROJECT_ID
 *   config.backend_canister_id === "undefined"  → if "undefined", reads process.env.CANISTER_ID_BACKEND
 *
 * Writing "" bypasses those checks and passes an empty string straight through
 * to the storage gateway, which rejects it with 403 Forbidden.
 */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function env(key) {
  const val = process.env[key];
  // Treat missing or literal "undefined" strings as absent — return the string "undefined"
  // so loadConfig() can use its own fallback logic rather than receiving ""
  if (!val || val === "undefined" || val.trim() === "") return "undefined";
  return val.trim();
}

const backendCanisterId = env("CANISTER_ID_BACKEND");
const storageGatewayUrlRaw = env("STORAGE_GATEWAY_URL");
const storageGatewayUrl =
  storageGatewayUrlRaw !== "undefined"
    ? storageGatewayUrlRaw
    : "https://blob.caffeine.ai";
const iiUrl = env("II_URL");
const dfxNetwork = env("DFX_NETWORK");

// project_id: use PROJECT_ID first, then CANISTER_ID_BACKEND, then "undefined"
const projectIdRaw = env("PROJECT_ID");
const projectId =
  projectIdRaw !== "undefined"
    ? projectIdRaw
    : backendCanisterId !== "undefined"
      ? backendCanisterId
      : "undefined";

// backend_host: only set for local dev
const dfxHostRaw = env("DFX_HOST");
const backendHost =
  dfxNetwork === "local"
    ? dfxHostRaw !== "undefined"
      ? dfxHostRaw
      : "http://localhost:4943"
    : "";

const config = {
  backend_host: backendHost,
  backend_canister_id: backendCanisterId,
  project_id: projectId,
  ii_derivation_origin: iiUrl,
  storage_gateway_url: storageGatewayUrl,
};

// Log what we're writing so CI/deploy logs show the actual values
console.log("[generate-env] Writing env.json:");
for (const [key, value] of Object.entries(config)) {
  if (value && value !== "undefined") {
    // Truncate long values like canister IDs for readability
    const display = value.length > 20 ? `${value.slice(0, 20)}…` : value;
    console.log(`  ${key}: ${display}`);
  } else {
    console.log(`  ${key}: (not set)`);
  }
}

if (backendCanisterId === "undefined") {
  console.warn(
    "[generate-env] WARNING: CANISTER_ID_BACKEND is not set — backend calls will fail",
  );
}

if (projectId === "undefined") {
  console.warn(
    "[generate-env] WARNING: project_id could not be determined (neither PROJECT_ID nor CANISTER_ID_BACKEND is set) — media uploads will get 403",
  );
}

const outputPath = resolve(__dirname, "../env.json");
writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(`[generate-env] env.json written to ${outputPath}`);

import { fileURLToPath, URL } from "node:url";
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import environment from "vite-plugin-environment";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ii_url =
  process.env.DFX_NETWORK === "local"
    ? `http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:8081/`
    : `https://identity.internetcomputer.org/`;

process.env.II_URL = process.env.II_URL || ii_url;
process.env.STORAGE_GATEWAY_URL =
  process.env.STORAGE_GATEWAY_URL || "https://blob.caffeine.ai";

/**
 * Reads an env var and returns the literal string "undefined" if it's missing or blank.
 *
 * loadConfig() in @caffeineai/core-infrastructure checks:
 *   config.project_id !== "undefined"  → if "undefined", uses DEFAULT_PROJECT_ID
 *   config.backend_canister_id === "undefined" → if "undefined", reads process.env.CANISTER_ID_BACKEND
 *
 * IMPORTANT: process.env.* in node_modules is NOT replaced by Vite, so the only reliable
 * way to pass CANISTER_ID_BACKEND to loadConfig() is via env.json. Writing "undefined"
 * here tells loadConfig() to use its own fallbacks; writing "" bypasses those fallbacks
 * and leaves an empty string as the actual value — which the storage gateway rejects with 403.
 */
function getEnv(key) {
  const val = process.env[key];
  if (!val || val === "undefined" || val.trim() === "") return "undefined";
  return val.trim();
}

/**
 * Vite plugin: generates env.json with real platform values before bundling.
 *
 * The Caffeine platform injects at build time:
 *   CANISTER_ID_BACKEND   – backend canister ID
 *   STORAGE_GATEWAY_URL   – storage gateway URL (https://blob.caffeine.ai)
 *   II_URL                – Internet Identity URL
 *   DFX_NETWORK           – "local" | "ic"
 *   PROJECT_ID            – Caffeine project UUID (primary source for project_id)
 *
 * For project_id we use PROJECT_ID first, then fall back to CANISTER_ID_BACKEND.
 * The storage gateway ties uploads to a project and rejects requests where
 * project_id is the default placeholder "0000000-0000-0000-0000-00000000000".
 */
function generateEnvJsonPlugin() {
  return {
    name: "generate-env-json",
    buildStart() {
      const backendCanisterId = getEnv("CANISTER_ID_BACKEND");
      const storageGatewayUrl =
        getEnv("STORAGE_GATEWAY_URL") !== "undefined"
          ? getEnv("STORAGE_GATEWAY_URL")
          : "https://blob.caffeine.ai";
      const iiUrl = getEnv("II_URL");
      const dfxNetwork = getEnv("DFX_NETWORK");

      // project_id: use PROJECT_ID first, then CANISTER_ID_BACKEND, then "undefined"
      // Writing "undefined" (the string) lets loadConfig() use its proper fallback mechanism.
      const projectIdRaw = getEnv("PROJECT_ID");
      const projectId =
        projectIdRaw !== "undefined"
          ? projectIdRaw
          : backendCanisterId !== "undefined"
            ? backendCanisterId
            : "undefined";

      // backend_host is only needed for local dev
      const dfxHost = getEnv("DFX_HOST");
      const backendHost =
        dfxNetwork === "local"
          ? dfxHost !== "undefined"
            ? dfxHost
            : "http://localhost:4943"
          : "";

      const config = {
        backend_host: backendHost,
        backend_canister_id: backendCanisterId,
        project_id: projectId,
        ii_derivation_origin: iiUrl,
        storage_gateway_url: storageGatewayUrl,
      };

      // Warn about missing critical values so they show up in deploy logs
      if (backendCanisterId === "undefined") {
        console.warn(
          "[generate-env-json] WARNING: CANISTER_ID_BACKEND is not set — backend calls will fail",
        );
      }
      if (projectId === "undefined") {
        console.warn(
          "[generate-env-json] WARNING: project_id is empty (neither PROJECT_ID nor CANISTER_ID_BACKEND set) — media uploads will get 403",
        );
      }

      const outputPath = resolve(__dirname, "env.json");
      writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`);

      // Log each field (truncated) so deploy logs confirm the values
      console.log("[generate-env-json] env.json written:");
      for (const [key, value] of Object.entries(config)) {
        if (value) {
          const display =
            value.length > 30 ? `${value.slice(0, 30)}…` : value;
          console.log(`  ${key}: ${display}`);
        } else {
          console.log(`  ${key}: (not set)`);
        }
      }
    },
  };
}

export default defineConfig({
  logLevel: "error",
  build: {
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
  },
  css: {
    postcss: "./postcss.config.js",
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    generateEnvJsonPlugin(),
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
    environment(["II_URL"]),
    environment(["STORAGE_GATEWAY_URL"]),
    react(),
  ],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
    dedupe: [
      "@dfinity/agent",
      "@caffeineai/object-storage",
      "@caffeineai/core-infrastructure",
    ],
  },
});

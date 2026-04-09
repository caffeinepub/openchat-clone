/**
 * useUploadFile — rebuilt from scratch
 *
 * Single responsibility: upload a File to the Caffeine object-storage extension
 * and return a persistent HTTPS URL.
 *
 * How it works:
 *  1. Load config (backend canister ID, project UUID, gateway URL) from env.json
 *  2. Create a fresh HttpAgent bound to the authenticated identity, pointed directly
 *     at the IC mainnet API (icp-api.io) — never routed through CDN proxy
 *  3. Create a StorageClient with the agent and call putFile()
 *     StorageClient.putFile() internally:
 *       a. Builds a blob Merkle tree + chunk hashes
 *       b. Calls _immutableObjectStorageCreateCertificate on the backend (via agent.call)
 *       c. Reads the IC certificate from the v3 update-call response body
 *       d. PUTs the blob tree + certificate to the storage gateway
 *       e. Uploads chunks in parallel
 *  4. Use storageClient.getDirectURL(hash) to construct the persistent URL
 */

import { loadConfig } from "@caffeineai/core-infrastructure";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { StorageClient } from "@caffeineai/object-storage";
import { HttpAgent } from "@icp-sdk/core/agent";
import type { Identity } from "@icp-sdk/core/agent";
import { useCallback } from "react";

// IC mainnet API — always explicit, never window.location
const IC_HOST = "https://icp-api.io";

export type UploadProgress = (percentage: number) => void;

// ─── Core upload function ─────────────────────────────────────────────────────

export async function uploadFileToStorage(
  file: File,
  onProgress?: UploadProgress,
  identity?: Identity,
): Promise<string> {
  // Step 1: Require authenticated identity
  if (!identity || identity.getPrincipal().isAnonymous()) {
    throw new Error("Upload requires a logged-in user. Please sign in first.");
  }

  console.log(
    `[Upload] principal=${identity.getPrincipal().toText().slice(0, 12)}…`,
  );

  // Step 2: Load config
  const config = await loadConfig();

  const { backend_canister_id, project_id, storage_gateway_url, backend_host } =
    config;

  console.log("[Upload] config:", {
    backend_canister_id: `${backend_canister_id?.slice(0, 10)}…`,
    project_id: `${project_id?.slice(0, 8)}…`,
    storage_gateway_url,
  });

  if (!backend_canister_id || backend_canister_id === "undefined") {
    throw new Error(
      "Storage not configured: backend_canister_id is missing. Check deployment config.",
    );
  }
  if (!project_id || project_id === "undefined") {
    throw new Error(
      "Storage not configured: project_id is missing. Ensure PROJECT_ID is set at build time.",
    );
  }
  if (!storage_gateway_url || storage_gateway_url === "nogateway") {
    throw new Error(
      "Storage not configured: STORAGE_GATEWAY_URL was not set at build time.",
    );
  }

  // Step 3: Create a fresh authenticated agent pointing directly at icp-api.io
  const isLocal =
    backend_host?.includes("localhost") || backend_host?.includes("127.0.0.1");
  const host = isLocal ? (backend_host ?? "http://localhost:4943") : IC_HOST;

  const agent = HttpAgent.createSync({ identity, host });

  if (isLocal) {
    await agent.fetchRootKey().catch((e: unknown) => {
      console.warn("[Upload] fetchRootKey failed (local dev):", e);
    });
  }

  console.log(`[Upload] HttpAgent created — host=${host}`);

  // Step 4: Read file bytes
  const bytes = new Uint8Array(
    await file.arrayBuffer(),
  ) as Uint8Array<ArrayBuffer>;
  console.log(
    `[Upload] file="${file.name}" size=${bytes.length} bytes type="${file.type}"`,
  );

  // Step 5: Create StorageClient and call putFile
  // StorageClient constructor: (bucket, gatewayUrl, backendCanisterId, projectId, agent)
  // putFile() handles: blob tree, certificate call, gateway upload, chunk upload
  const bucket = config.bucket_name ?? "default-bucket";

  const client = new StorageClient(
    bucket,
    storage_gateway_url,
    backend_canister_id,
    project_id,
    agent,
  );

  console.log("[Upload] StorageClient ready — calling putFile…", {
    bucket,
    gateway: storage_gateway_url,
    owner: `${backend_canister_id.slice(0, 12)}…`,
    project: `${project_id.slice(0, 8)}…`,
  });

  let hash: string;
  try {
    const result = await client.putFile(bytes, onProgress);
    hash = result.hash;
    console.log(
      "[Upload] ✓ putFile succeeded — hash:",
      `${hash.slice(0, 20)}…`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Upload] ✗ putFile failed:", msg);
    throw new Error(`Upload failed: ${msg}`);
  }

  // Step 6: Build URL using the official StorageClient.getDirectURL API
  const url = await client.getDirectURL(hash);
  console.log("[Upload] ✓ URL:", `${url.slice(0, 80)}…`);
  return url;
}

// ─── React hook ───────────────────────────────────────────────────────────────

export function useUploadFile() {
  const { identity } = useInternetIdentity();

  const upload = useCallback(
    (file: File, onProgress?: UploadProgress): Promise<string> => {
      if (!identity || identity.getPrincipal().isAnonymous()) {
        return Promise.reject(
          new Error("Please log in before uploading media."),
        );
      }
      return uploadFileToStorage(file, onProgress, identity);
    },
    [identity],
  );

  return { upload };
}

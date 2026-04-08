import { loadConfig } from "@caffeineai/core-infrastructure";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { StorageClient } from "@caffeineai/object-storage";
import { HttpAgent } from "@icp-sdk/core/agent";
import type { Identity } from "@icp-sdk/core/agent";
import { useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const GATEWAY_VERSION = "v1";
const DEFAULT_BUCKET_NAME = "default-bucket";

// ─── URL construction helper ──────────────────────────────────────────────────

function buildDirectURL(
  gatewayUrl: string,
  hash: string,
  backendCanisterId: string,
  projectId: string,
): string {
  return (
    `${gatewayUrl}/${GATEWAY_VERSION}/blob/` +
    `?blob_hash=${encodeURIComponent(hash)}` +
    `&owner_id=${encodeURIComponent(backendCanisterId)}` +
    `&project_id=${encodeURIComponent(projectId)}`
  );
}

// ─── Extra env.json fields ────────────────────────────────────────────────────
// loadConfig() from @caffeineai/core-infrastructure does not expose all fields
// written to env.json (e.g. bucket_name). Read them here directly.

interface EnvJsonExtras {
  bucket_name?: string;
}

async function readEnvJsonExtras(): Promise<EnvJsonExtras> {
  try {
    const resp = await fetch("/env.json");
    if (!resp.ok) return {};
    const data = (await resp.json()) as Record<string, string>;
    return {
      bucket_name:
        data.bucket_name && data.bucket_name !== "undefined"
          ? data.bucket_name
          : undefined,
    };
  } catch {
    return {};
  }
}

// ─── Core upload function ─────────────────────────────────────────────────────

export type UploadProgress = (progress: number) => void;

export async function uploadFileToStorage(
  file: File,
  onProgress?: UploadProgress,
  identity?: Identity,
): Promise<string> {
  // ── Step 1: Validate identity ─────────────────────────────────────────────

  if (!identity) {
    console.error("[Upload] ✗ No identity provided — user is not logged in");
    throw new Error("Not authenticated — please log in to upload media.");
  }

  const principal = identity.getPrincipal();
  const isAnonymous = principal.isAnonymous();
  console.log(
    `[Upload] Identity: principal=${principal.toText().slice(0, 12)}… anonymous=${isAnonymous}`,
  );

  if (isAnonymous) {
    console.error(
      "[Upload] ✗ Identity is anonymous — Internet Identity delegation not active",
    );
    throw new Error(
      "Upload requires a logged-in Internet Identity. Anonymous identity cannot upload files.",
    );
  }

  // ── Step 2: Load config ───────────────────────────────────────────────────

  let config: Awaited<ReturnType<typeof loadConfig>>;
  let extras: EnvJsonExtras;

  try {
    [config, extras] = await Promise.all([loadConfig(), readEnvJsonExtras()]);
    console.log("[Upload] Config loaded:", {
      backend_canister_id: config.backend_canister_id
        ? `${config.backend_canister_id.slice(0, 10)}…`
        : "MISSING",
      storage_gateway_url: config.storage_gateway_url || "MISSING",
      project_id: config.project_id
        ? `${config.project_id.slice(0, 8)}…`
        : "MISSING",
      bucket_name: extras.bucket_name ?? config.bucket_name ?? "MISSING",
    });
  } catch (err) {
    console.error("[Upload] ✗ Failed to load config:", err);
    throw new Error(
      `Storage not configured: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (
    !config.backend_canister_id ||
    config.backend_canister_id === "undefined"
  ) {
    console.error(
      "[Upload] ✗ backend_canister_id is missing or 'undefined' — app not deployed or env.json not served",
    );
    throw new Error(
      "Storage not configured — backend canister ID is missing. Please check deployment config.",
    );
  }

  if (
    !config.storage_gateway_url ||
    config.storage_gateway_url === "nogateway"
  ) {
    console.error(
      "[Upload] ✗ storage_gateway_url is missing or 'nogateway' — STORAGE_GATEWAY_URL env var not set at build time",
    );
    throw new Error(
      "Storage gateway not configured — STORAGE_GATEWAY_URL was not set during deployment.",
    );
  }

  // Detect invalid/placeholder project_id values.
  // Valid values are:
  //   - A canister ID like "xxxxx-xxxxx-xxxxx-xxxxx-cai"  ← used when CANISTER_ID_BACKEND is the project_id
  //   - A real UUID like "550e8400-e29b-41d4-a716-446655440000"
  // Invalid values we must reject before constructing StorageClient:
  const PLACEHOLDER_PATTERNS = [
    "", // empty string
    "undefined", // literal string written by getEnv() when env var is missing
    "00000000-0000-0000-0000-000000000000", // standard all-zeros UUID
    "0000000-0000-0000-0000-00000000000", // short all-zeros UUID (11 zeros / 35 chars)
  ];
  if (
    !config.project_id ||
    PLACEHOLDER_PATTERNS.includes(config.project_id) ||
    /^0+(-0+)*$/.test(config.project_id) // any all-zeros UUID variant
  ) {
    console.error(
      "[Upload] ✗ project_id is missing, 'undefined', or a placeholder. " +
        "Ensure CANISTER_ID_BACKEND is set at build time.",
    );
    throw new Error(
      "Storage not configured — project_id is missing or is a placeholder.",
    );
  }

  const bucketName = extras.bucket_name ?? DEFAULT_BUCKET_NAME;

  console.log(
    `[Upload] File: name="${file.name}" size=${file.size} bytes type="${file.type}"`,
  );

  // ── Step 3: Create a fresh authenticated HttpAgent ────────────────────────
  // A fresh agent per-upload prevents stale auth delegation issues.

  // Normalise backend_host: treat empty string the same as undefined so
  // HttpAgent uses its default IC boundary-node discovery rather than
  // trying to connect to an empty-string host (which resolves to the
  // current page origin on some runtimes and can cause cert/routing issues).
  const backendHost =
    config.backend_host && config.backend_host.trim() !== ""
      ? config.backend_host
      : undefined;

  let agent: HttpAgent;
  try {
    agent = new HttpAgent({
      identity,
      ...(backendHost !== undefined ? { host: backendHost } : {}),
    });

    // Fetch root key for local dev only
    if (backendHost?.includes("localhost")) {
      await agent.fetchRootKey().catch((err: unknown) => {
        console.warn("[Upload] Unable to fetch root key:", err);
      });
    }

    console.log(
      `[Upload] Fresh HttpAgent created with identity. host=${backendHost ?? "(default IC host)"}`,
    );
  } catch (err) {
    console.error("[Upload] ✗ Failed to create HttpAgent:", err);
    throw new Error(
      `Failed to create upload agent: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // ── Step 4: Create StorageClient and upload ───────────────────────────────
  // StorageClient.putFile internally:
  //   1. Computes the blob Merkle tree root hash
  //   2. Calls getCertificate(hash) → calls _immutableObjectStorageCreateCertificate on backend
  //   3. Gets IC certificate from v3 update call response
  //   4. Sends blob tree + certificate to storage gateway
  //   5. Uploads chunks in parallel
  //
  // This is the correct upload flow as defined by the Caffeine object-storage extension.

  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes = new Uint8Array(await file.arrayBuffer()) as Uint8Array<ArrayBuffer>;
    console.log(`[Upload] File bytes read: ${bytes.length} bytes`);
  } catch (err) {
    console.error("[Upload] ✗ Failed to read file bytes:", err);
    throw new Error(
      `Failed to read file: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const storageClient = new StorageClient(
    bucketName,
    config.storage_gateway_url,
    config.backend_canister_id,
    config.project_id,
    agent,
  );

  console.log(
    "[Upload] StorageClient created. Calling putFile (certificate + upload)…",
    {
      bucket: bucketName,
      gateway: config.storage_gateway_url,
      owner: `${config.backend_canister_id.slice(0, 12)}…`,
      projectId: `${config.project_id.slice(0, 12)}…`,
    },
  );

  let hash: string;
  try {
    const result = await storageClient.putFile(bytes, onProgress);
    hash = result.hash;
    console.log("[Upload] putFile succeeded. hash:", `${hash.slice(0, 30)}…`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[Upload] ✗ StorageClient.putFile threw:", {
      message,
      stack,
      isV3ResponseBodyError: message.includes("Expected v3 response body"),
      is403Error: message.includes("403"),
      isForbiddenError:
        message.toLowerCase().includes("forbidden") ||
        message.toLowerCase().includes("invalid payload"),
    });
    throw new Error(`Upload failed: ${message}`);
  }

  // ── Step 5: Build persistent URL ─────────────────────────────────────────

  const url = buildDirectURL(
    config.storage_gateway_url,
    hash,
    config.backend_canister_id,
    config.project_id,
  );

  if (!url.startsWith("https://")) {
    console.error("[Upload] ✗ Built URL is not https:", url.slice(0, 80));
    throw new Error(
      `Upload returned a non-persistent URL — got: ${url.slice(0, 60)}`,
    );
  }

  console.log("[Upload] ✓ Upload complete. URL:", `${url.slice(0, 80)}…`);
  return url;
}

// ─── React hook ───────────────────────────────────────────────────────────────

/**
 * Hook that exposes an authenticated upload function.
 *
 * Creates a fresh StorageClient per upload call with a fresh HttpAgent
 * to prevent stale delegation state from causing 403 errors.
 */
export function useUploadFile() {
  const { identity } = useInternetIdentity();

  const upload = useCallback(
    (file: File, onProgress?: UploadProgress): Promise<string> => {
      if (!identity) {
        console.error(
          "[useUploadFile] upload() called but identity is undefined — user not logged in",
        );
        return Promise.reject(new Error("Please log in to upload media."));
      }
      if (identity.getPrincipal().isAnonymous()) {
        console.error(
          "[useUploadFile] upload() called with anonymous identity — II delegation not active",
        );
        return Promise.reject(
          new Error(
            "Please complete Internet Identity login before uploading media.",
          ),
        );
      }
      return uploadFileToStorage(file, onProgress, identity);
    },
    [identity],
  );

  return { upload };
}

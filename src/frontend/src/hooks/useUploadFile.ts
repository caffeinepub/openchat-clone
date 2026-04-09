import { loadConfig } from "@caffeineai/core-infrastructure";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { StorageClient } from "@caffeineai/object-storage";
import { HttpAgent } from "@icp-sdk/core/agent";
import type { Identity } from "@icp-sdk/core/agent";
import { useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_BUCKET_NAME = "default-bucket";
// Mainnet IC API endpoint — always explicit so we never accidentally
// route through the CDN or page-origin proxy.
const IC_MAINNET_HOST = "https://icp-api.io";

// ─── URL construction helper ──────────────────────────────────────────────────

function buildDirectURL(
  gatewayUrl: string,
  hash: string,
  backendCanisterId: string,
  projectId: string,
): string {
  return (
    `${gatewayUrl}/v1/blob/` +
    `?blob_hash=${encodeURIComponent(hash)}` +
    `&owner_id=${encodeURIComponent(backendCanisterId)}` +
    `&project_id=${encodeURIComponent(projectId)}`
  );
}

// ─── Extra env.json fields ────────────────────────────────────────────────────

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
  const PLACEHOLDER_PATTERNS = [
    "",
    "undefined",
    "00000000-0000-0000-0000-000000000000",
    "0000000-0000-0000-0000-00000000000",
  ];
  if (
    !config.project_id ||
    PLACEHOLDER_PATTERNS.includes(config.project_id) ||
    /^0+(-0+)*$/.test(config.project_id)
  ) {
    console.error(
      "[Upload] ✗ project_id is missing, 'undefined', or a placeholder. " +
        "Ensure PROJECT_ID or CANISTER_ID_BACKEND is set at build time.",
    );
    throw new Error(
      "Storage not configured — project_id is missing or is a placeholder.",
    );
  }

  const bucketName = extras.bucket_name ?? DEFAULT_BUCKET_NAME;
  const gatewayUrl = config.storage_gateway_url;

  console.log(
    `[Upload] File: name="${file.name}" size=${file.size} bytes type="${file.type}"`,
  );
  console.log(
    `[Upload] project_id="${config.project_id}" owner="${config.backend_canister_id}" bucket="${bucketName}"`,
  );

  // ── Step 3: Create a fresh authenticated HttpAgent ────────────────────────
  // Always use the explicit IC mainnet host (icp-api.io) or the configured
  // backend_host for local dev. Never rely on window.location auto-detection
  // which can route through the CDN proxy on deployed Caffeine apps.

  const isLocalDev =
    config.backend_host?.includes("localhost") ||
    config.backend_host?.includes("127.0.0.1");

  // For local dev: use the configured DFX host.
  // For mainnet: always use icp-api.io directly.
  const agentHost = isLocalDev
    ? (config.backend_host ?? "http://localhost:4943")
    : IC_MAINNET_HOST;

  let agent: HttpAgent;
  try {
    agent = HttpAgent.createSync({
      identity,
      host: agentHost,
    });

    if (isLocalDev) {
      await agent.fetchRootKey().catch((err: unknown) => {
        console.warn("[Upload] Unable to fetch root key:", err);
      });
    }

    console.log(`[Upload] HttpAgent created with host=${agentHost}`);
  } catch (err) {
    console.error("[Upload] ✗ Failed to create HttpAgent:", err);
    throw new Error(
      `Failed to create upload agent: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // ── Step 4: Read file bytes ───────────────────────────────────────────────

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

  // ── Step 5: Create StorageClient and upload ───────────────────────────────
  // StorageClient.putFile internally:
  //   1. Builds blob Merkle tree and root hash
  //   2. Calls getCertificate(hash) → agent.call(_immutableObjectStorageCreateCertificate)
  //   3. Gets IC certificate from v3 update-call response body
  //   4. Sends blob tree + certificate to storage gateway PUT /v1/blob-tree/
  //   5. Uploads chunks in parallel

  const storageClient = new StorageClient(
    bucketName,
    gatewayUrl,
    config.backend_canister_id,
    config.project_id,
    agent,
  );

  console.log("[Upload] StorageClient created. Calling putFile…", {
    bucket: bucketName,
    gateway: gatewayUrl,
    owner: `${config.backend_canister_id.slice(0, 12)}…`,
    projectId: `${config.project_id.slice(0, 12)}…`,
    host: agentHost,
  });

  let hash: string;
  try {
    const result = await storageClient.putFile(bytes, onProgress);
    hash = result.hash;
    console.log("[Upload] ✓ putFile succeeded. hash:", `${hash.slice(0, 30)}…`);
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

  // ── Step 6: Build persistent URL ─────────────────────────────────────────

  const url = buildDirectURL(
    gatewayUrl,
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
 * explicitly pointed at the IC mainnet endpoint (icp-api.io).
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

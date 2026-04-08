import {
  createActorWithConfig,
  loadConfig,
  useInternetIdentity,
} from "@caffeineai/core-infrastructure";
import { ExternalBlob } from "@caffeineai/object-storage";
import type { Identity } from "@icp-sdk/core/agent";
import { useCallback } from "react";
import { createActor } from "../backend";

// ─── Constants ────────────────────────────────────────────────────────────────

const MOTOKO_DEDUPLICATION_SENTINEL = "!caf!";
const GATEWAY_VERSION = "v1";

// ─── URL construction helper ──────────────────────────────────────────────────
//
// Replicates StorageClient.getDirectURL() without needing a StorageClient instance.
// The URL format is stable and defined by the storage gateway spec.

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
  try {
    config = await loadConfig();
    console.log("[Upload] Config loaded:", {
      backend_canister_id: config.backend_canister_id
        ? `${config.backend_canister_id.slice(0, 10)}…`
        : "MISSING",
      storage_gateway_url: config.storage_gateway_url || "MISSING",
      project_id: config.project_id
        ? `${config.project_id.slice(0, 8)}…`
        : "MISSING",
      bucket_name: config.bucket_name || "MISSING",
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

  // DEFAULT_PROJECT_ID sentinel from @caffeineai/core-infrastructure — used when no real
  // project_id is available. The storage gateway rejects this placeholder with 403.
  const BOGUS_PROJECT_ID = "0000000-0000-0000-0000-00000000000";
  if (
    !config.project_id ||
    config.project_id === "undefined" ||
    config.project_id === BOGUS_PROJECT_ID
  ) {
    console.error(
      "[Upload] ✗ project_id is missing, 'undefined', or the default placeholder — storage gateway will reject with 403. " +
        "Ensure CANISTER_ID_BACKEND or PROJECT_ID is set at build time.",
    );
    throw new Error(
      "Storage not configured — project_id is missing or is a placeholder. Media uploads require a valid project ID injected at build time.",
    );
  }

  console.log(
    `[Upload] File: name="${file.name}" size=${file.size} bytes type="${file.type}"`,
  );

  // ── Step 3: Initialize upload client ─────────────────────────────────────

  let capturedUploadFn: ((file: ExternalBlob) => Promise<Uint8Array>) | null =
    null;

  try {
    console.log(
      "[Upload] Initializing StorageClient via createActorWithConfig…",
    );
    await createActorWithConfig(
      (canisterId, uploadFile, downloadFile, options) => {
        capturedUploadFn = uploadFile;
        console.log(
          "[Upload] StorageClient.putFile captured. canisterId=",
          typeof canisterId === "string"
            ? `${canisterId.slice(0, 12)}…`
            : `${String(canisterId).slice(0, 12)}…`,
        );
        return createActor(canisterId, uploadFile, downloadFile, options);
      },
      {
        agentOptions: { identity },
      },
    );
  } catch (err) {
    console.error("[Upload] ✗ createActorWithConfig threw:", err);
    throw new Error(
      `Failed to initialize storage client: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!capturedUploadFn) {
    console.error(
      "[Upload] ✗ capturedUploadFn is null after createActorWithConfig — factory did not call createActor",
    );
    throw new Error(
      "Upload client initialization failed — upload callback was not captured.",
    );
  }

  const uploadFn: (file: ExternalBlob) => Promise<Uint8Array> =
    capturedUploadFn;

  // ── Step 4: Build ExternalBlob and upload ─────────────────────────────────

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

  const blob = ExternalBlob.fromBytes(bytes);
  if (onProgress) {
    blob.withUploadProgress(onProgress);
  }

  console.log("[Upload] Calling StorageClient.putFile (certificate + upload)…");

  let hashBytes: Uint8Array;
  try {
    hashBytes = new Uint8Array(await uploadFn(blob));
    console.log(
      "[Upload] putFile succeeded. hashBytes length:",
      hashBytes.length,
    );
  } catch (err) {
    // Log full details — this is where 403 manifests
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

  // ── Step 5: Decode hash and build URL ─────────────────────────────────────

  const hashWithPrefix = new TextDecoder().decode(hashBytes);
  if (!hashWithPrefix.startsWith(MOTOKO_DEDUPLICATION_SENTINEL)) {
    console.error(
      "[Upload] ✗ Unexpected hash format (no sentinel prefix):",
      JSON.stringify(hashWithPrefix.slice(0, 80)),
    );
    throw new Error(
      "Upload returned an unexpected hash format — storage upload likely failed.",
    );
  }

  const hash = hashWithPrefix.substring(MOTOKO_DEDUPLICATION_SENTINEL.length);
  console.log("[Upload] Hash decoded:", `${hash.slice(0, 20)}…`);

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
 * Uses createActorWithConfig (the platform's canonical actor factory) so the
 * upload goes through the exact same agent/StorageClient initialization as all
 * other backend calls. This ensures the certificate flow matches what the
 * storage gateway expects.
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

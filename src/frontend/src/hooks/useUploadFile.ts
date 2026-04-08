import {
  loadConfig,
  useInternetIdentity,
} from "@caffeineai/core-infrastructure";
import { StorageClient } from "@caffeineai/object-storage";
import { HttpAgent, type Identity } from "@icp-sdk/core/agent";
import { useCallback } from "react";

// Build a fresh StorageClient for the given identity.
// Never cache anonymous sessions — the storage gateway rejects unsigned certificate requests.
async function buildStorageClient(identity: Identity): Promise<StorageClient> {
  const config = await loadConfig();

  if (
    !config.backend_canister_id ||
    config.backend_canister_id === "undefined"
  ) {
    throw new Error(
      "Storage not configured — backend canister ID is missing. Please check deployment config.",
    );
  }

  const agent = new HttpAgent({
    host: config.backend_host,
    identity,
  });

  if (config.backend_host?.includes("localhost")) {
    await agent.fetchRootKey().catch(() => {
      // Silently ignore — local replica may not be running during dev
    });
  }

  return new StorageClient(
    config.bucket_name,
    config.storage_gateway_url,
    config.backend_canister_id,
    config.project_id,
    agent,
  );
}

// Cache keyed by identity principal so each authenticated user gets their own client.
// Anonymous clients are never cached — they always fail.
const _clientCache = new Map<string, Promise<StorageClient>>();

export type UploadProgress = (progress: number) => void;

/**
 * Upload a File to object storage and return a permanent URL.
 * Requires an authenticated Identity — throws if identity is not provided.
 * Never returns blob: or data: URLs. Throws on any failure so callers can
 * surface the error to the user rather than silently passing a session-only URL.
 */
export async function uploadFileToStorage(
  file: File,
  onProgress?: UploadProgress,
  identity?: Identity,
): Promise<string> {
  if (!identity) {
    throw new Error("Not authenticated — please log in to upload media.");
  }

  // Evict cached client if it may be stale (e.g. after identity change)
  const cacheKey = identity.getPrincipal().toText();
  if (!_clientCache.has(cacheKey)) {
    _clientCache.set(cacheKey, buildStorageClient(identity));
  }

  let client: StorageClient;
  try {
    client = await _clientCache.get(cacheKey)!;
  } catch (err) {
    // Build failed — evict cache so next call retries
    _clientCache.delete(cacheKey);
    throw new Error(
      `Failed to connect to storage: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { hash } = await client.putFile(bytes, onProgress);
    const url = await client.getDirectURL(hash);
    return url;
  } catch (err) {
    // Evict cache on failure in case client is in a bad state
    _clientCache.delete(cacheKey);
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Upload failed: ${message}`);
  }
}

/**
 * Hook that exposes an authenticated upload function.
 * Uses the Internet Identity from context so uploads are signed with the user's identity.
 * Always creates a fresh StorageClient per upload call to avoid stale identity issues.
 */
export function useUploadFile() {
  const { identity } = useInternetIdentity();

  const upload = useCallback(
    (file: File, onProgress?: UploadProgress): Promise<string> => {
      if (!identity) {
        return Promise.reject(new Error("Please log in to upload media."));
      }
      return uploadFileToStorage(file, onProgress, identity);
    },
    [identity],
  );

  return { upload };
}

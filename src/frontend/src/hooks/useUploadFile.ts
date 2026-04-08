import {
  loadConfig,
  useInternetIdentity,
} from "@caffeineai/core-infrastructure";
import { StorageClient } from "@caffeineai/object-storage";
import { HttpAgent, type Identity } from "@icp-sdk/core/agent";
import { useCallback } from "react";
import { createActor } from "../backend";

// ─── Shared agent + client factory ──────────────────────────────────────────
//
// Both the StorageClient (for uploads) and the backend actor (for the
// _immutableObjectStorageCreateCertificate canister call) MUST use the same
// HttpAgent instance. Using two separate agents — even with the same identity —
// causes 403 "Invalid payload" errors because the storage gateway validates
// the certificate against the exact agent/delegation that signed the call.
//
// This factory creates ONE agent from the current identity and wires it into
// both the StorageClient and a one-off Backend actor. The client is never
// cached — it's created fresh per upload to guarantee a live delegation.

interface UploadClients {
  storageClient: StorageClient;
}

async function buildUploadClients(identity: Identity): Promise<UploadClients> {
  const config = await loadConfig();

  if (
    !config.backend_canister_id ||
    config.backend_canister_id === "undefined"
  ) {
    throw new Error(
      "Storage not configured — backend canister ID is missing. Please check deployment config.",
    );
  }

  // ONE agent for both clients — shared auth state is critical.
  const agent = new HttpAgent({
    host: config.backend_host,
    identity,
  });

  if (config.backend_host?.includes("localhost")) {
    await agent.fetchRootKey().catch(() => {
      // Silently ignore — local replica may not be running during dev
    });
  }

  // Wire the same agent into the backend actor so the certificate call and the
  // StorageClient both share the same authenticated HttpAgent instance.
  const MOTOKO_DEDUPLICATION_SENTINEL = "!caf!";
  const storageClient = new StorageClient(
    config.bucket_name,
    config.storage_gateway_url,
    config.backend_canister_id,
    config.project_id,
    agent,
  );

  const _backendWithSharedAgent = createActor(
    config.backend_canister_id,
    async (file) => {
      const { hash } = await storageClient.putFile(
        await file.getBytes(),
        file.onProgress,
      );
      return new TextEncoder().encode(MOTOKO_DEDUPLICATION_SENTINEL + hash);
    },
    async (bytes) => {
      const hashWithPrefix = new TextDecoder().decode(new Uint8Array(bytes));
      const hash = hashWithPrefix.substring(
        MOTOKO_DEDUPLICATION_SENTINEL.length,
      );
      const { ExternalBlob } = await import("@caffeineai/object-storage");
      const url = await storageClient.getDirectURL(hash);
      return ExternalBlob.fromURL(url);
    },
    { agent },
  );

  return { storageClient };
}

export type UploadProgress = (progress: number) => void;

/**
 * Upload a File to object storage and return a permanent https:// URL.
 *
 * Requirements:
 * - Requires an authenticated Identity — throws if identity is not provided.
 * - Never returns blob: or data: URLs. Throws on any failure.
 * - A fresh agent + StorageClient is built for every upload to avoid stale
 *   delegation state (a cached agent with an expired or partially-initialised
 *   delegation causes the backend to reject the certificate, which the storage
 *   gateway reports as 403 Forbidden: Invalid payload).
 * - Both the StorageClient and the backend actor share the SAME HttpAgent
 *   instance so the certificate call and the upload use the same auth context.
 */
export async function uploadFileToStorage(
  file: File,
  onProgress?: UploadProgress,
  identity?: Identity,
): Promise<string> {
  if (!identity) {
    throw new Error("Not authenticated — please log in to upload media.");
  }

  // Always build a fresh client pair to ensure the identity delegation is current.
  let clients: UploadClients;
  try {
    clients = await buildUploadClients(identity);
  } catch (err) {
    throw new Error(
      `Failed to connect to storage: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  let url: string;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { hash } = await clients.storageClient.putFile(bytes, onProgress);
    url = await clients.storageClient.getDirectURL(hash);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Upload failed: ${message}`);
  }

  // Validate that the returned URL is a persistent https:// URL, not a
  // temporary blob: or data: URL that would break after the session ends.
  if (!url.startsWith("https://")) {
    throw new Error(
      `Upload returned a temporary URL — storage upload likely failed. Got: ${url.slice(0, 60)}`,
    );
  }

  return url;
}

/**
 * Hook that exposes an authenticated upload function.
 * Uses the Internet Identity from context so uploads are signed with the
 * user's identity. A fresh StorageClient + shared agent is created per
 * upload call to avoid stale agent/delegation issues.
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

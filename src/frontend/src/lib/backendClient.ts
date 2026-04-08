/**
 * Backend client factory.
 *
 * `getBackendClient()` returns a fully configured Backend instance that uses
 * the Caffeine object-storage extension for media uploads and the authenticated
 * Internet Identity for all calls.
 *
 * Type adapters in this file convert between:
 *   - Backend (Principal / bigint) types  ↔  Frontend (string / number) types
 */

import { createActorWithConfig } from "@caffeineai/core-infrastructure";
import { HttpAgent } from "@icp-sdk/core/agent";
import type { Identity } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import { type Backend, createActor } from "../backend";

import type {
  CatalogMessage as BECatalogMessage,
  CatalogRoom as BECatalogRoom,
  ConversationSummary as BEConversationSummary,
  EditEntry as BEEditEntry,
  Message as BEMessage,
  MessageContent as BEMessageContent,
  MessagePage as BEMessagePage,
  PinnedMessage as BEPinnedMessage,
  Post as BEPost,
  ReactionGroup as BEReactionGroup,
  SearchResult as BESearchResult,
  UserProfile as BEUserProfile,
} from "../backend.d.ts";

import type {
  AudioContent,
  CatalogMessage,
  CatalogRoom,
  ConversationSummary,
  EditEntry,
  FeedPost,
  FeedReply,
  ImageContent,
  LinkContent,
  Message,
  MessageContentType,
  MessagePage,
  PinnedMessage,
  ReactionGroup,
  SearchResult,
  UserProfile,
  VideoContent,
} from "../types";

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type { Backend };
export type {
  BECatalogMessage,
  BECatalogRoom,
  BEConversationSummary,
  BEMessage,
  BEPost,
  BEUserProfile,
};

// ─── Client factory ───────────────────────────────────────────────────────────

/**
 * Returns a fresh Backend instance configured for the given identity.
 *
 * Caching is intentionally disabled: a cached client holds a cached HttpAgent
 * that can accumulate stale delegation state. If the identity's delegation
 * expires or refreshes between calls, the cached agent still holds the old
 * delegation — causing the backend (and the object-storage gateway) to reject
 * requests with a 403 "Invalid payload" error.
 *
 * Since uploads and most mutations don't happen at high frequency, the cost of
 * creating a fresh client per call is negligible and far outweighs the risk of
 * stale auth causing silent failures.
 */
export function getBackendClient(identity?: Identity): Promise<Backend> {
  return createActorWithConfig(createActor, {
    agentOptions: identity ? { identity } : undefined,
  }) as Promise<Backend>;
}

/** No-op — kept for API compatibility. Cache was removed; nothing to clear. */
export function clearBackendClientCache(): void {
  // Cache removed — no-op. Kept so callers don't need to update their imports.
}

// ─── Primitive adapters ───────────────────────────────────────────────────────

export function principalToString(p: Principal): string {
  return p.toText();
}

export function stringToPrincipal(s: string): Principal {
  return Principal.fromText(s);
}

export function bigintToNumber(n: bigint): number {
  return Number(n);
}

export function numberToBigint(n: number): bigint {
  return BigInt(Math.floor(n));
}

/** Convert Motoko optional [T] | [] → T | undefined */
export function fromOpt<T>(opt: [T] | []): T | undefined {
  return opt.length > 0 ? opt[0] : undefined;
}

/**
 * Runtime-safe optional unwrap.
 * Handles BOTH TypeScript `T | undefined` (from backend.d.ts typings)
 * AND actual Candid runtime `[] | [T]` values (the real wire format).
 */
function unwrapOpt<T>(val: unknown): T | undefined {
  if (val === undefined || val === null) return undefined;
  if (Array.isArray(val)) return val.length > 0 ? (val[0] as T) : undefined;
  return val as T;
}

// ─── MessageContent adapter ───────────────────────────────────────────────────

export function adaptMessageContent(
  c: BEMessageContent,
): MessageContentType | undefined {
  if (c.__kind__ === "deleted") return { kind: "deleted" };
  if (c.__kind__ === "text") return { kind: "text", text: c.text };
  if (c.__kind__ === "image") {
    const w = unwrapOpt<bigint>(c.image.width);
    const h = unwrapOpt<bigint>(c.image.height);
    return {
      kind: "image",
      image: {
        url: c.image.url,
        mimeType: c.image.mimeType,
        fileSize: bigintToNumber(c.image.fileSize),
        width: w !== undefined ? bigintToNumber(w) : undefined,
        height: h !== undefined ? bigintToNumber(h) : undefined,
      } satisfies ImageContent,
    };
  }
  if (c.__kind__ === "video") {
    const dur = unwrapOpt<bigint>(c.video.duration);
    return {
      kind: "video",
      video: {
        url: c.video.url,
        mimeType: c.video.mimeType,
        fileSize: bigintToNumber(c.video.fileSize),
        thumbnailUrl: unwrapOpt<string>(c.video.thumbnailUrl),
        duration: dur !== undefined ? bigintToNumber(dur) : undefined,
      } satisfies VideoContent,
    };
  }
  if (c.__kind__ === "audio") {
    const dur = unwrapOpt<bigint>(c.audio.duration);
    return {
      kind: "audio",
      audio: {
        url: c.audio.url,
        mimeType: c.audio.mimeType,
        fileSize: bigintToNumber(c.audio.fileSize),
        duration: dur !== undefined ? bigintToNumber(dur) : undefined,
      } satisfies AudioContent,
    };
  }
  if (c.__kind__ === "link") {
    return {
      kind: "link",
      link: {
        url: c.link.url,
        title: unwrapOpt<string>(c.link.title),
        description: unwrapOpt<string>(c.link.description),
        imageUrl: unwrapOpt<string>(c.link.imageUrl),
      } satisfies LinkContent,
    };
  }
  return undefined;
}

/** Extract plain text from a backend MessageContent */
export function contentToText(c: BEMessageContent): string {
  if (c.__kind__ === "text") return c.text;
  if (c.__kind__ === "deleted") return "(deleted)";
  if (c.__kind__ === "image") return "📷 Image";
  if (c.__kind__ === "video") return "🎬 Video";
  if (c.__kind__ === "audio") return "🎙 Audio";
  if (c.__kind__ === "link") return `🔗 ${c.link.url}`;
  return "";
}

// ─── UserProfile adapter ──────────────────────────────────────────────────────

export function adaptUserProfile(be: BEUserProfile): UserProfile {
  const displayName = be.displayName || principalToString(be.id).slice(0, 10);
  return {
    id: principalToString(be.id),
    displayName,
    avatarInitials: displayName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    memberSince: be.registeredAt,
    profileImageUrl: unwrapOpt<string>(be.profileImageUrl),
    bio: unwrapOpt<string>(be.bio),
    usernameHandle: unwrapOpt<string>(be.usernameHandle),
    lastHandleChange: (() => {
      const lhc = unwrapOpt<bigint>(be.lastHandleChange);
      return lhc !== undefined ? bigintToNumber(lhc) : undefined;
    })(),
  };
}

// ─── ConversationSummary adapter ──────────────────────────────────────────────

export function adaptConversation(
  be: BEConversationSummary,
): ConversationSummary {
  const isGroup = be.kind.__kind__ === "group";
  const name =
    isGroup && be.kind.__kind__ === "group" ? be.kind.group.name : "";
  return {
    id: be.id.toString(),
    type: isGroup ? "group" : "direct",
    name,
    lastMessage: undefined,
    lastMessageTime: unwrapOpt<bigint>(be.lastMessageAt),
    unreadCount: bigintToNumber(be.unreadCount),
    memberIds: be.members.map(principalToString),
  };
}

// ─── Message adapter ──────────────────────────────────────────────────────────

export function adaptMessage(
  be: BEMessage,
  profileMap?: Record<string, UserProfile>,
): Message {
  const senderId = principalToString(be.sender);
  const content = adaptMessageContent(be.content);
  const text = contentToText(be.content);
  return {
    id: be.id.toString(),
    conversationId: be.conversationId.toString(),
    senderId,
    senderProfile: profileMap?.[senderId],
    text,
    content: content?.kind !== "text" ? content : undefined,
    timestamp: be.sentAt,
    deleted: be.content.__kind__ === "deleted",
  };
}

// ─── MessagePage adapter ──────────────────────────────────────────────────────

export function adaptMessagePage(
  be: BEMessagePage,
  profileMap?: Record<string, UserProfile>,
): MessagePage {
  return {
    messages: be.messages.map((m) => adaptMessage(m, profileMap)),
    hasMore: be.nextCursor != null,
  };
}

// ─── ReactionGroup adapter ────────────────────────────────────────────────────

export function adaptReactions(
  beReactions: Array<[string, Array<Principal>]>,
): ReactionGroup[] {
  return beReactions.map(([emoji, users]) => ({
    emoji,
    count: users.length,
    userIds: users.map(principalToString),
  }));
}

// ─── CatalogRoom adapter ──────────────────────────────────────────────────────

export function adaptCatalogRoom(be: BECatalogRoom): CatalogRoom {
  return {
    id: be.id.toString(),
    title: be.title,
    description: be.description,
    coverImageUrl: unwrapOpt<string>(be.coverImageUrl),
    creator: principalToString(be.creator),
    createdAt: bigintToNumber(be.createdAt),
    lastActivityAt: bigintToNumber(be.lastActivityAt),
    members: be.members.map(principalToString),
    messageCount: bigintToNumber(be.messageCount),
  };
}

// ─── CatalogMessage adapter ───────────────────────────────────────────────────

export function adaptCatalogMessage(be: BECatalogMessage): CatalogMessage {
  const content = adaptMessageContent(be.content);
  const text = contentToText(be.content);
  return {
    id: be.id.toString(),
    roomId: be.roomId.toString(),
    author: principalToString(be.author),
    text,
    content: content?.kind !== "text" ? content : undefined,
    createdAt: bigintToNumber(be.createdAt),
    deletedByCreator: be.deleted,
    editedAt: (() => {
      const ea = unwrapOpt<bigint>(be.editedAt as unknown);
      return ea !== undefined ? bigintToNumber(ea) : undefined;
    })(),
    pinned: be.pinned,
    reactions: adaptReactions(be.reactions),
  };
}

// ─── Post (feed) adapter ──────────────────────────────────────────────────────

export function adaptPost(
  be: BEPost,
  currentUserId?: string,
  profileMap?: Record<string, UserProfile>,
): FeedPost {
  const authorId = principalToString(be.author);
  const authorProfile = profileMap?.[authorId] ?? {
    id: authorId,
    displayName: authorId.slice(0, 10),
    avatarInitials: authorId.slice(0, 2).toUpperCase(),
  };
  const content = adaptMessageContent(be.content);
  const text = contentToText(be.content);
  const likedByMe = currentUserId
    ? be.likedBy.some((u) => principalToString(u) === currentUserId)
    : false;

  return {
    id: be.id,
    author: authorProfile,
    text,
    content: content?.kind !== "text" ? content : undefined,
    timestamp: be.timestamp,
    likeCount: be.likedBy.length,
    likedByMe,
    replyCount: 0,
  };
}

// ─── Post → FeedReply adapter ─────────────────────────────────────────────────

export function adaptPostAsReply(
  be: BEPost,
  postId: bigint,
  currentUserId?: string,
  profileMap?: Record<string, UserProfile>,
): FeedReply {
  const authorId = principalToString(be.author);
  const authorProfile = profileMap?.[authorId] ?? {
    id: authorId,
    displayName: authorId.slice(0, 10),
    avatarInitials: authorId.slice(0, 2).toUpperCase(),
  };
  const content = adaptMessageContent(be.content);
  const text = contentToText(be.content);
  const likedByMe = currentUserId
    ? be.likedBy.some((u) => principalToString(u) === currentUserId)
    : false;

  return {
    id: be.id,
    postId,
    author: authorProfile,
    text,
    content: content?.kind !== "text" ? content : undefined,
    timestamp: be.timestamp,
    likeCount: be.likedBy.length,
    likedByMe,
    pinned: be.pinned,
    reactions: adaptReactions(be.reactions),
  };
}

// ─── PinnedMessage adapter ────────────────────────────────────────────────────

export function adaptPinnedMessage(
  be: BEPinnedMessage,
  profileMap?: Record<string, UserProfile>,
): PinnedMessage {
  return {
    messageId: be.messageId.toString(),
    conversationId: be.conversationId.toString(),
    pinnedBy: principalToString(be.pinnedBy),
    pinnedAt: be.pinnedAt,
    message: adaptMessage(be.message, profileMap),
  };
}

// ─── EditEntry adapter ────────────────────────────────────────────────────────

export function adaptEditEntry(be: BEEditEntry): EditEntry {
  return {
    editedAt: be.editedAt,
    previousContent: contentToText(be.previousContent),
  };
}

// ─── SearchResult adapter ─────────────────────────────────────────────────────

export function adaptSearchResult(be: BESearchResult): SearchResult {
  return {
    messageId: be.messageId.toString(),
    conversationId: be.conversationId.toString(),
    conversationName: be.conversationId.toString(),
    sender: principalToString(be.sender),
    snippet: be.snippet,
    sentAt: be.sentAt,
  };
}

// ─── Frontend MessageContentType → Backend MessageContent ────────────────────

export function toBackendMessageContent(
  c: MessageContentType,
): BEMessageContent {
  if (c.kind === "text") return { __kind__: "text", text: c.text };
  if (c.kind === "deleted") return { __kind__: "deleted", deleted: null };
  if (c.kind === "image") {
    return {
      __kind__: "image",
      image: {
        url: c.image.url,
        mimeType: c.image.mimeType,
        fileSize: BigInt(c.image.fileSize),
        width: c.image.width != null ? BigInt(c.image.width) : undefined,
        height: c.image.height != null ? BigInt(c.image.height) : undefined,
      },
    };
  }
  if (c.kind === "video") {
    return {
      __kind__: "video",
      video: {
        url: c.video.url,
        mimeType: c.video.mimeType,
        fileSize: BigInt(c.video.fileSize),
        thumbnailUrl: c.video.thumbnailUrl,
        duration:
          c.video.duration != null ? BigInt(c.video.duration) : undefined,
      },
    };
  }
  if (c.kind === "audio") {
    return {
      __kind__: "audio",
      audio: {
        url: c.audio.url,
        mimeType: c.audio.mimeType,
        fileSize: BigInt(c.audio.fileSize),
        duration:
          c.audio.duration != null ? BigInt(c.audio.duration) : undefined,
      },
    };
  }
  if (c.kind === "link") {
    return {
      __kind__: "link",
      link: {
        url: c.link.url,
        title: c.link.title,
        description: c.link.description,
        imageUrl: c.link.imageUrl,
      },
    };
  }
  // fallback
  return { __kind__: "text", text: "" };
}

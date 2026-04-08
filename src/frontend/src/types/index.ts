export type UserId = string;
export type ConversationId = string;
export type MessageId = string;

export interface UserProfile {
  id: UserId;
  displayName: string;
  avatarInitials: string;
  memberSince?: bigint;
  profileImageUrl?: string;
  bio?: string;
  usernameHandle?: string;
  /** Unix ms timestamp of last handle change */
  lastHandleChange?: number;
}

export type ConversationType = "direct" | "group";

export interface ConversationSummary {
  id: ConversationId;
  type: ConversationType;
  name: string;
  lastMessage?: string;
  lastMessageTime?: bigint;
  unreadCount: number;
  memberIds: UserId[];
  memberProfiles?: UserProfile[];
}

// ─── Media content types ──────────────────────────────────────────────────────

export interface ImageContent {
  url: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
}

export interface VideoContent {
  url: string;
  mimeType: string;
  fileSize: number;
  thumbnailUrl?: string;
  duration?: number;
}

export interface AudioContent {
  url: string;
  mimeType: string;
  fileSize: number;
  duration?: number;
}

export interface LinkContent {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
}

export type MessageContentType =
  | { kind: "text"; text: string }
  | { kind: "deleted" }
  | { kind: "image"; image: ImageContent }
  | { kind: "video"; video: VideoContent }
  | { kind: "audio"; audio: AudioContent }
  | { kind: "link"; link: LinkContent };

export interface Message {
  id: MessageId;
  conversationId: ConversationId;
  senderId: UserId;
  senderProfile?: UserProfile;
  /** Plain text for backward-compat and text messages */
  text: string;
  /** Structured content — present for media/link messages */
  content?: MessageContentType;
  timestamp: bigint;
  deleted: boolean;
  /** Set when message has been edited */
  editedAt?: bigint;
  /** True when this message is pinned */
  pinned?: boolean;
}

export interface MessagePage {
  messages: Message[];
  hasMore: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: UserProfile | null;
  login: () => void;
  logout: () => void;
}

// ─── Upload state ─────────────────────────────────────────────────────────────

export type MediaKind = "image" | "video" | "audio";

export interface PendingMedia {
  kind: MediaKind;
  file: File;
  /** Object URL for local preview */
  previewUrl: string;
  /** Upload progress 0-100 */
  progress: number;
  /** Set once upload completes */
  uploadedUrl?: string;
}

export interface LinkPreview {
  url: string;
  domain: string;
  title?: string;
  description?: string;
  imageUrl?: string;
}

// ─── Reactions ────────────────────────────────────────────────────────────────

export interface ReactionGroup {
  emoji: string;
  count: number;
  /** User IDs who reacted with this emoji */
  userIds: UserId[];
}

// ─── Typing ───────────────────────────────────────────────────────────────────

export interface TypingEntry {
  user: UserProfile;
  conversationId: ConversationId;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchResult {
  messageId: MessageId;
  conversationId: ConversationId;
  conversationName: string;
  sender: UserId;
  senderProfile?: UserProfile;
  snippet: string;
  sentAt: bigint;
}

// ─── Pinned messages ──────────────────────────────────────────────────────────

export interface PinnedMessage {
  messageId: MessageId;
  conversationId: ConversationId;
  pinnedBy: UserId;
  pinnedAt: bigint;
  message: Message;
}

// ─── Edit history ─────────────────────────────────────────────────────────────

export interface EditEntry {
  editedAt: bigint;
  previousContent: string;
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export interface CatalogRoom {
  id: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  creator: string;
  createdAt: number;
  lastActivityAt: number;
  members: string[];
  messageCount: number;
}

export interface CatalogMessage {
  id: string;
  roomId: string;
  author: string;
  /** Plain text caption / fallback */
  text: string;
  /** Structured rich content — image, video, audio, link */
  content?: MessageContentType;
  mediaUrl?: string;
  createdAt: number;
  deletedByCreator: boolean;
  editedAt?: number;
  pinned?: boolean;
  reactions?: ReactionGroup[];
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

export type PostId = bigint;

export interface FeedPost {
  id: PostId;
  author: UserProfile;
  text: string;
  mediaUrl?: string;
  mediaKind?: "image" | "video";
  /** Rich content variant */
  content?: MessageContentType;
  timestamp: bigint;
  likeCount: number;
  likedByMe: boolean;
  replyCount: number;
}

export interface FeedReply {
  id: PostId;
  postId: PostId;
  author: UserProfile;
  text: string;
  /** Rich content variant */
  content?: MessageContentType;
  timestamp: bigint;
  likeCount: number;
  likedByMe: boolean;
  editedAt?: bigint;
  pinned?: boolean;
  reactions?: ReactionGroup[];
}

// ─── Unified message (used by ChatMessageBubble) ──────────────────────────────

/**
 * Normalised message shape consumed by ChatMessageBubble.
 * All room-type-specific message types map into this.
 */
export interface UnifiedMessage {
  /** Stable string id — BigInt post/reply IDs are converted via .toString() */
  id: string;
  senderId: UserId;
  senderProfile?: UserProfile;
  /** Primary display text */
  text: string;
  /** Rich content variant */
  content?: MessageContentType;
  /** Unix ms or BigInt (both supported) */
  timestamp: bigint | number;
  deleted: boolean;
  editedAt?: bigint | number;
  pinned?: boolean;
  reactions?: ReactionGroup[];
}

// ─── Room context (used by useChatRoom + ChatComposeBar) ─────────────────────

export type RoomType = "group" | "catalog" | "feed";

export interface RoomContext {
  roomType: RoomType;
  /** conversationId for group, roomId for catalog, postId.toString() for feed */
  roomId: string;
  /** True if the current user is the room/post creator */
  isCreator: boolean;
}

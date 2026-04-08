import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface VideoContent {
    url: string;
    duration?: bigint;
    thumbnailUrl?: string;
    mimeType: string;
    fileSize: bigint;
}
export type Timestamp = bigint;
export interface SearchResult {
    messageId: MessageId;
    snippet: string;
    sender: UserId;
    sentAt: Timestamp;
    conversationId: ConversationId;
}
export type PostId = bigint;
export interface SendFeedMediaInput {
    parentPostId?: PostId;
    content: MessageContent;
}
export interface AudioContent {
    url: string;
    duration?: bigint;
    mimeType: string;
    fileSize: bigint;
}
export type RoomId = bigint;
export type MessageContent = {
    __kind__: "deleted";
    deleted: null;
} | {
    __kind__: "audio";
    audio: AudioContent;
} | {
    __kind__: "video";
    video: VideoContent;
} | {
    __kind__: "link";
    link: LinkContent;
} | {
    __kind__: "text";
    text: string;
} | {
    __kind__: "image";
    image: ImageContent;
};
export type ConversationId = bigint;
export interface UpdateProfileRequest {
    bio?: string;
    displayName?: string;
    usernameHandle?: string;
    profileImageUrl?: string;
}
export interface Post {
    id: PostId;
    parentPostId?: PostId;
    content: MessageContent;
    likedBy: Array<UserId>;
    author: UserId;
    pinned: boolean;
    timestamp: Timestamp;
    reactions: Array<[string, Array<UserId>]>;
}
export interface CatalogRoom {
    id: RoomId;
    coverImageUrl?: string;
    title: string;
    creator: UserId;
    members: Array<UserId>;
    createdAt: Timestamp;
    description: string;
    messageCount: bigint;
    lastActivityAt: Timestamp;
}
export interface CatalogMessage {
    id: MessageId;
    deleted: boolean;
    content: MessageContent;
    createdAt: Timestamp;
    author: UserId;
    pinned: boolean;
    roomId: RoomId;
    editedAt?: Timestamp;
    reactions: Array<[string, Array<UserId>]>;
}
export interface ConversationSummary {
    id: ConversationId;
    members: Array<UserId>;
    lastMessageAt?: Timestamp;
    kind: ConversationKind;
    unreadCount: bigint;
}
export interface SendMessageInput {
    content: MessageContent;
    conversationId: bigint;
}
export interface PinnedMessage {
    messageId: MessageId;
    conversationId: ConversationId;
    message: Message;
    pinnedAt: Timestamp;
    pinnedBy: UserId;
}
export interface LinkContent {
    url: string;
    title?: string;
    description?: string;
    imageUrl?: string;
}
export interface EditEntry {
    editedAt: Timestamp;
    previousContent: MessageContent;
}
export type ConversationKind = {
    __kind__: "group";
    group: {
        name: string;
    };
} | {
    __kind__: "direct";
    direct: null;
};
export interface ImageContent {
    url: string;
    height?: bigint;
    mimeType: string;
    fileSize: bigint;
    width?: bigint;
}
export type UserId = Principal;
export interface FeedPage {
    total: bigint;
    posts: Array<Post>;
}
export type MessageId = bigint;
export interface SendCatalogMediaInput {
    content: MessageContent;
    roomId: RoomId;
}
export interface Message {
    id: MessageId;
    content: MessageContent;
    sender: UserId;
    sentAt: Timestamp;
    conversationId: ConversationId;
}
export interface ReactionGroup {
    count: bigint;
    userIds: Array<UserId>;
    emoji: string;
}
export type UpdateProfileResult = {
    __kind__: "ok";
    ok: UserProfile;
} | {
    __kind__: "err";
    err: string;
};
export interface MessagePage {
    messages: Array<Message>;
    nextCursor?: MessageId;
}
export interface UserProfile {
    id: UserId;
    bio?: string;
    displayName: string;
    lastHandleChange?: bigint;
    registeredAt: Timestamp;
    usernameHandle?: string;
    profileImageUrl?: string;
}
export interface backendInterface {
    addCatalogReaction(roomId: RoomId, messageId: MessageId, emoji: string): Promise<void>;
    addFeedReaction(postId: PostId, emoji: string): Promise<void>;
    addReaction(messageId: MessageId, emoji: string): Promise<void>;
    addReply(postId: PostId, input: SendFeedMediaInput): Promise<Post>;
    createCatalogRoom(title: string, description: string, coverImageUrl: string | null): Promise<CatalogRoom>;
    createDirectConversation(otherUserId: UserId): Promise<ConversationSummary>;
    createGroupConversation(name: string, memberIds: Array<UserId>): Promise<ConversationSummary>;
    createPost(input: SendFeedMediaInput): Promise<Post>;
    deleteCatalogMessage(roomId: RoomId, messageId: MessageId): Promise<void>;
    deleteMessage(messageId: MessageId): Promise<boolean>;
    deletePost(postId: PostId): Promise<void>;
    editCatalogMessage(roomId: RoomId, messageId: MessageId, newText: string): Promise<void>;
    editMessage(messageId: MessageId, newContent: MessageContent): Promise<void>;
    getCatalogMessages(roomId: RoomId, beforeId: MessageId | null): Promise<Array<CatalogMessage>>;
    getCatalogRoom(roomId: RoomId): Promise<CatalogRoom | null>;
    getCatalogRooms(search: string | null): Promise<Array<CatalogRoom>>;
    getCatalogTypingUsers(roomId: RoomId): Promise<Array<UserId>>;
    getConversation(conversationId: ConversationId): Promise<ConversationSummary | null>;
    getEditHistory(messageId: MessageId): Promise<Array<EditEntry>>;
    getFeedPosts(offset: bigint, limit: bigint): Promise<FeedPage>;
    getFeedTypingUsers(postId: PostId): Promise<Array<UserId>>;
    getJoinedCatalogRooms(): Promise<Array<CatalogRoom>>;
    getMessages(conversationId: ConversationId, beforeId: MessageId | null, limit: bigint): Promise<MessagePage>;
    getOrCreateProfile(displayName: string): Promise<UserProfile>;
    getPinnedCatalogMessages(roomId: RoomId): Promise<Array<CatalogMessage>>;
    getPinnedFeedReplies(postId: PostId): Promise<Array<Post>>;
    getPinnedMessages(conversationId: ConversationId): Promise<Array<PinnedMessage>>;
    getPostLikes(postId: PostId): Promise<Array<UserId>>;
    getPostReplies(postId: PostId): Promise<Array<Post>>;
    getProfile(userId: UserId): Promise<UserProfile | null>;
    getReactions(messageId: MessageId): Promise<Array<ReactionGroup>>;
    getSharedConversations(targetUserId: UserId): Promise<Array<ConversationSummary>>;
    getTypingUsers(conversationId: ConversationId): Promise<Array<UserProfile>>;
    getUnreadCatalogCount(roomId: RoomId): Promise<bigint>;
    getUnreadFeedCount(): Promise<bigint>;
    joinCatalogRoom(roomId: RoomId): Promise<void>;
    leaveCatalogRoom(roomId: RoomId): Promise<void>;
    likePost(postId: PostId): Promise<void>;
    listConversations(): Promise<Array<ConversationSummary>>;
    markCatalogRoomRead(roomId: RoomId): Promise<void>;
    markConversationRead(conversationId: ConversationId): Promise<void>;
    markFeedRead(): Promise<void>;
    pinCatalogMessage(roomId: RoomId, messageId: MessageId): Promise<void>;
    pinFeedReply(postId: PostId, replyId: PostId): Promise<void>;
    pinMessage(messageId: MessageId): Promise<void>;
    removeCatalogReaction(roomId: RoomId, messageId: MessageId, emoji: string): Promise<void>;
    removeFeedReaction(postId: PostId, emoji: string): Promise<void>;
    removeReaction(messageId: MessageId): Promise<void>;
    removeUserFromCatalogRoom(roomId: RoomId, userId: Principal): Promise<void>;
    reportCatalogRoom(roomId: RoomId, reason: string): Promise<void>;
    searchMessages(keyword: string): Promise<Array<SearchResult>>;
    sendCatalogMediaMessage(input: SendCatalogMediaInput): Promise<CatalogMessage>;
    sendMediaMessage(input: SendMessageInput): Promise<Message>;
    sendMessage(conversationId: ConversationId, text: string): Promise<Message>;
    setCatalogTyping(roomId: RoomId): Promise<void>;
    setFeedTyping(postId: PostId): Promise<void>;
    setTyping(conversationId: ConversationId, isTyping: boolean): Promise<void>;
    unlikePost(postId: PostId): Promise<void>;
    unpinCatalogMessage(roomId: RoomId, messageId: MessageId): Promise<void>;
    unpinFeedReply(postId: PostId, replyId: PostId): Promise<void>;
    unpinMessage(messageId: MessageId): Promise<void>;
    updateProfile(req: UpdateProfileRequest): Promise<UpdateProfileResult>;
}

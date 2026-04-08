import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adaptCatalogMessage,
  adaptCatalogRoom,
  adaptConversation,
  adaptEditEntry,
  adaptMessage,
  adaptMessagePage,
  adaptPinnedMessage,
  adaptPost,
  adaptPostAsReply,
  adaptReactions,
  adaptSearchResult,
  adaptUserProfile,
  bigintToNumber,
  clearBackendClientCache,
  contentToText,
  getBackendClient,
  principalToString,
  stringToPrincipal,
  toBackendMessageContent,
} from "../lib/backendClient";
import type {
  CatalogMessage,
  ConversationId,
  ConversationSummary,
  EditEntry,
  FeedPost,
  FeedReply,
  Message,
  MessageContentType,
  MessagePage,
  PinnedMessage,
  ReactionGroup,
  SearchResult,
  UserId,
  UserProfile,
} from "../types";
import type { CatalogRoom as FECatalogRoom } from "../types";

// ─── Auth helper ──────────────────────────────────────────────────────────────

function useBackendClient() {
  const { identity } = useInternetIdentity();
  return {
    getClient: () => getBackendClient(identity ?? undefined),
    isReady: identity != null && !identity.getPrincipal().isAnonymous(),
    identity,
  };
}

// ─── Profile hooks ────────────────────────────────────────────────────────────

export function useGetProfile(userId: UserId | null) {
  const { getClient, isReady } = useBackendClient();
  return useQuery<UserProfile | null>({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const client = await getClient();
      let principal: Principal;
      try {
        principal = stringToPrincipal(userId);
      } catch {
        return null;
      }
      const result = await client.getProfile(principal);
      return result ? adaptUserProfile(result) : null;
    },
    enabled: !!userId && isReady,
  });
}

export function useGetOrCreateProfile() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ displayName }: { displayName: string }) => {
      const client = await getClient();
      const result = await client.getOrCreateProfile(displayName);
      return adaptUserProfile(result);
    },
    onSuccess: (profile) => {
      qc.setQueryData(["profile", profile.id], profile);
    },
  });
}

export function useUpdateProfile() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId: _userId,
      displayName,
      profileImageUrl,
      bio,
      usernameHandle,
    }: {
      userId: UserId;
      displayName?: string;
      profileImageUrl?: string | null;
      bio?: string;
      usernameHandle?: string;
    }) => {
      const client = await getClient();
      const result = await client.updateProfile({
        displayName,
        profileImageUrl: profileImageUrl ?? undefined,
        bio,
        usernameHandle,
      });
      if (result.__kind__ === "err") throw new Error(result.err);
      return adaptUserProfile(result.ok);
    },
    onSuccess: (profile, { userId }) => {
      qc.setQueryData(["profile", userId], profile);
      qc.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });
}

// ─── Conversation hooks ───────────────────────────────────────────────────────

export function useListConversations() {
  const { getClient, isReady } = useBackendClient();
  return useQuery<ConversationSummary[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const client = await getClient();
      const results = await client.listConversations();
      return results.map(adaptConversation);
    },
    enabled: isReady,
    refetchInterval: 10000,
  });
}

export function useGetMessages(conversationId: ConversationId | null) {
  const { getClient, isReady } = useBackendClient();
  return useQuery<MessagePage>({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return { messages: [], hasMore: false };
      const client = await getClient();
      const page = await client.getMessages(
        BigInt(conversationId),
        null,
        BigInt(50),
      );
      return adaptMessagePage(page);
    },
    enabled: !!conversationId && isReady,
    refetchInterval: 5000,
  });
}

export function useSendMessage() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      text,
    }: {
      conversationId: ConversationId;
      text: string;
      currentUserId?: string;
      currentUserInitials?: string;
    }) => {
      const client = await getClient();
      const msg = await client.sendMessage(BigInt(conversationId), text);
      return adaptMessage(msg);
    },
    onSuccess: (_, { conversationId }) => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useSendMediaMessage() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
    }: {
      conversationId: ConversationId;
      text?: string;
      content: MessageContentType;
      currentUserId?: string;
      currentUserInitials?: string;
    }) => {
      const client = await getClient();
      const msg = await client.sendMediaMessage({
        conversationId: BigInt(conversationId),
        content: toBackendMessageContent(content),
      });
      return adaptMessage(msg);
    },
    onSuccess: (_, { conversationId }) => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useDeleteMessage() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      messageId,
    }: {
      messageId: string;
      conversationId: ConversationId;
    }) => {
      const client = await getClient();
      return client.deleteMessage(BigInt(messageId));
    },
    onSuccess: (_, { conversationId }) => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}

export function useMarkConversationRead() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: ConversationId) => {
      const client = await getClient();
      await client.markConversationRead(BigInt(conversationId));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useCreateDirectConversation() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      otherUserId,
    }: {
      otherUserId: UserId;
      displayName?: string;
    }) => {
      const client = await getClient();
      const result = await client.createDirectConversation(
        stringToPrincipal(otherUserId),
      );
      return adaptConversation(result);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useCreateGroupConversation() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      memberIds,
    }: {
      name: string;
      memberIds: UserId[];
    }) => {
      const client = await getClient();
      const result = await client.createGroupConversation(
        name,
        memberIds.map(stringToPrincipal),
      );
      return adaptConversation(result);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// ─── Reactions hooks ──────────────────────────────────────────────────────────

export function useGetReactions(messageId: string | null) {
  const { getClient, isReady } = useBackendClient();
  return useQuery<ReactionGroup[]>({
    queryKey: ["reactions", messageId],
    queryFn: async () => {
      if (!messageId) return [];
      const client = await getClient();
      const result = await client.getReactions(BigInt(messageId));
      return result.map((r) => ({
        emoji: r.emoji,
        count: bigintToNumber(r.count),
        userIds: r.userIds.map(principalToString),
      }));
    },
    enabled: !!messageId && isReady,
    staleTime: 5000,
  });
}

export function useAddReaction() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
      currentUserId?: UserId;
    }) => {
      const client = await getClient();
      await client.addReaction(BigInt(messageId), emoji);
    },
    onSuccess: (_, { messageId }) => {
      qc.invalidateQueries({ queryKey: ["reactions", messageId] });
    },
  });
}

export function useRemoveReaction() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      messageId,
    }: {
      messageId: string;
      emoji?: string;
      currentUserId?: UserId;
    }) => {
      const client = await getClient();
      await client.removeReaction(BigInt(messageId));
    },
    onSuccess: (_, { messageId }) => {
      qc.invalidateQueries({ queryKey: ["reactions", messageId] });
    },
  });
}

// ─── Typing hooks ─────────────────────────────────────────────────────────────

export function useSetTyping() {
  const { getClient } = useBackendClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      isTyping,
    }: {
      conversationId: ConversationId;
      isTyping: boolean;
      currentUserId?: UserId;
    }) => {
      const client = await getClient();
      await client.setTyping(BigInt(conversationId), isTyping);
    },
  });
}

export function useGetTypingUsers(
  conversationId: ConversationId | null,
  _currentUserId: UserId | null,
) {
  const { getClient, isReady } = useBackendClient();
  return useQuery<UserProfile[]>({
    queryKey: ["typing", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const client = await getClient();
      const profiles = await client.getTypingUsers(BigInt(conversationId));
      return profiles.map(adaptUserProfile);
    },
    enabled: !!conversationId && isReady,
    refetchInterval: 3000,
  });
}

// ─── Search hooks ─────────────────────────────────────────────────────────────

export function useSearchMessages(keyword: string) {
  const { getClient, isReady } = useBackendClient();
  return useQuery<SearchResult[]>({
    queryKey: ["search", keyword],
    queryFn: async () => {
      if (!keyword || keyword.length < 3) return [];
      const client = await getClient();
      const results = await client.searchMessages(keyword);
      return results.map(adaptSearchResult);
    },
    enabled: keyword.length >= 3 && isReady,
    staleTime: 10000,
  });
}

// ─── Pin hooks ────────────────────────────────────────────────────────────────

export function useGetPinnedMessages(conversationId: ConversationId | null) {
  const { getClient, isReady } = useBackendClient();
  return useQuery<PinnedMessage[]>({
    queryKey: ["pinned", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const client = await getClient();
      const results = await client.getPinnedMessages(BigInt(conversationId));
      return results.map((p) => adaptPinnedMessage(p));
    },
    enabled: !!conversationId && isReady,
  });
}

export function usePinMessage() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      messageId,
      conversationId: _conversationId,
    }: {
      messageId: string;
      conversationId: ConversationId;
      currentUserId?: UserId;
    }) => {
      const client = await getClient();
      await client.pinMessage(BigInt(messageId));
    },
    onSuccess: (_, { conversationId }) => {
      qc.invalidateQueries({ queryKey: ["pinned", conversationId] });
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}

export function useUnpinMessage() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      messageId,
      conversationId: _conversationId2,
    }: {
      messageId: string;
      conversationId: ConversationId;
    }) => {
      const client = await getClient();
      await client.unpinMessage(BigInt(messageId));
    },
    onSuccess: (_, { conversationId }) => {
      qc.invalidateQueries({ queryKey: ["pinned", conversationId] });
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}

// ─── Edit hooks ───────────────────────────────────────────────────────────────

export function useEditMessage() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      messageId,
      conversationId: _conversationId3,
      newText,
    }: {
      messageId: string;
      conversationId: ConversationId;
      newText: string;
    }) => {
      const client = await getClient();
      await client.editMessage(BigInt(messageId), {
        __kind__: "text",
        text: newText,
      });
    },
    onSuccess: (_, { conversationId }) => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}

export function useGetEditHistory(messageId: string | null) {
  const { getClient, isReady } = useBackendClient();
  return useQuery<EditEntry[]>({
    queryKey: ["editHistory", messageId],
    queryFn: async () => {
      if (!messageId) return [];
      const client = await getClient();
      const results = await client.getEditHistory(BigInt(messageId));
      return results.map(adaptEditEntry);
    },
    enabled: !!messageId && isReady,
  });
}

// ─── Feed hooks ───────────────────────────────────────────────────────────────

export function useGetFeedPosts() {
  const { getClient, isReady, identity } = useBackendClient();
  return useQuery<FeedPost[]>({
    queryKey: ["feedPosts"],
    queryFn: async () => {
      const client = await getClient();
      const page = await client.getFeedPosts(BigInt(0), BigInt(50));
      const currentUserId = identity
        ? principalToString(identity.getPrincipal())
        : undefined;
      return page.posts
        .filter((p) => {
          const pid = p.parentPostId as [] | [bigint] | undefined;
          if (Array.isArray(pid)) return pid.length === 0;
          return !pid;
        })
        .map((p) => adaptPost(p, currentUserId));
    },
    enabled: isReady,
    refetchInterval: 15000,
  });
}

export function useCreatePost() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      text,
      content,
    }: {
      text: string;
      mediaUrl?: string;
      mediaKind?: "image" | "video";
      content?: MessageContentType;
      currentUserProfile?: UserProfile;
    }) => {
      const client = await getClient();
      const beContent = content
        ? toBackendMessageContent(content)
        : { __kind__: "text" as const, text };
      const result = await client.createPost({ content: beContent });
      return adaptPost(result);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedPosts"] });
    },
  });
}

export function useLikePost() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId }: { postId: bigint }) => {
      const client = await getClient();
      await client.likePost(postId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedPosts"] });
    },
  });
}

export function useUnlikePost() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId }: { postId: bigint }) => {
      const client = await getClient();
      await client.unlikePost(postId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedPosts"] });
    },
  });
}

export function useAddReply() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      text,
      content,
    }: {
      postId: bigint;
      text: string;
      content?: MessageContentType;
      currentUserProfile?: UserProfile;
    }) => {
      const client = await getClient();
      const beContent = content
        ? toBackendMessageContent(content)
        : { __kind__: "text" as const, text };
      const result = await client.addReply(postId, {
        content: beContent,
        parentPostId: postId,
      });
      return adaptPostAsReply(result, postId);
    },
    onSuccess: (_, { postId }) => {
      qc.invalidateQueries({ queryKey: ["feedReplies", postId.toString()] });
      qc.invalidateQueries({ queryKey: ["feedPosts"] });
    },
  });
}

export function useLikeReply() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      replyId,
      postId: _postId1,
    }: { replyId: bigint; postId: bigint }) => {
      const client = await getClient();
      await client.likePost(replyId);
    },
    onSuccess: (_, { postId }) => {
      qc.invalidateQueries({ queryKey: ["feedReplies", postId.toString()] });
    },
  });
}

export function useUnlikeReply() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      replyId,
      postId: _postId2,
    }: { replyId: bigint; postId: bigint }) => {
      const client = await getClient();
      await client.unlikePost(replyId);
    },
    onSuccess: (_, { postId }) => {
      qc.invalidateQueries({ queryKey: ["feedReplies", postId.toString()] });
    },
  });
}

export function useGetPostReplies(postId: bigint | null) {
  const { getClient, isReady, identity } = useBackendClient();
  return useQuery<FeedReply[]>({
    queryKey: ["feedReplies", postId?.toString()],
    queryFn: async () => {
      if (!postId) return [];
      const client = await getClient();
      const results = await client.getPostReplies(postId);
      const currentUserId = identity
        ? principalToString(identity.getPrincipal())
        : undefined;
      return results.map((p) => adaptPostAsReply(p, postId, currentUserId));
    },
    enabled: !!postId && isReady,
    refetchInterval: 5000,
  });
}

export function useGetUnreadFeedCount() {
  const { getClient, isReady } = useBackendClient();
  return useQuery<number>({
    queryKey: ["feedUnread"],
    queryFn: async () => {
      const client = await getClient();
      const count = await client.getUnreadFeedCount();
      return bigintToNumber(count);
    },
    enabled: isReady,
    refetchInterval: 30000,
  });
}

export function useMarkFeedRead() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const client = await getClient();
      await client.markFeedRead();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedUnread"] });
    },
  });
}

// ─── Feed reply reactions ─────────────────────────────────────────────────────

export function useAddFeedReaction() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      replyId,
      postId: _postId3,
      emoji,
    }: {
      replyId: string;
      postId: string;
      emoji: string;
      currentUserId?: string;
    }) => {
      const client = await getClient();
      await client.addFeedReaction(BigInt(replyId), emoji);
    },
    onSuccess: (_, { postId }) => {
      qc.invalidateQueries({ queryKey: ["feedReplies", postId] });
    },
  });
}

export function useRemoveFeedReaction() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      replyId,
      postId: _postId4,
      emoji,
    }: {
      replyId: string;
      postId: string;
      emoji: string;
      currentUserId?: string;
    }) => {
      const client = await getClient();
      await client.removeFeedReaction(BigInt(replyId), emoji);
    },
    onSuccess: (_, { postId }) => {
      qc.invalidateQueries({ queryKey: ["feedReplies", postId] });
    },
  });
}

// ─── Feed typing ──────────────────────────────────────────────────────────────

export function useSetFeedTyping() {
  const { getClient } = useBackendClient();
  return useMutation({
    mutationFn: async ({
      postId,
    }: {
      postId: string;
      isTyping?: boolean;
      currentUserId?: string;
    }) => {
      const client = await getClient();
      await client.setFeedTyping(BigInt(postId));
    },
  });
}

export function useGetFeedTypingUsers(
  postId: string | null,
  _currentUserId: string | null,
) {
  const { getClient, isReady } = useBackendClient();
  return useQuery<UserProfile[]>({
    queryKey: ["feedTyping", postId],
    queryFn: async () => {
      if (!postId) return [];
      const client = await getClient();
      const userIds = await client.getFeedTypingUsers(BigInt(postId));
      // Return minimal profiles from principals
      return userIds.map((p) => {
        const id = principalToString(p);
        return {
          id,
          displayName: id.slice(0, 10),
          avatarInitials: id.slice(0, 2).toUpperCase(),
        };
      });
    },
    enabled: !!postId && isReady,
    refetchInterval: 3000,
  });
}

// ─── Feed reply pin / edit ────────────────────────────────────────────────────

export function usePinFeedReply() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      replyId,
      postId,
    }: { replyId: string; postId: string }) => {
      const client = await getClient();
      await client.pinFeedReply(BigInt(postId), BigInt(replyId));
    },
    onSuccess: (_, { postId }) => {
      qc.invalidateQueries({ queryKey: ["feedReplies", postId] });
    },
  });
}

export function useUnpinFeedReply() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      replyId,
      postId,
    }: { replyId: string; postId: string }) => {
      const client = await getClient();
      await client.unpinFeedReply(BigInt(postId), BigInt(replyId));
    },
    onSuccess: (_, { postId }) => {
      qc.invalidateQueries({ queryKey: ["feedReplies", postId] });
    },
  });
}

export function useEditFeedReply() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      replyId,
      newText,
    }: {
      replyId: string;
      postId: string;
      newText: string;
    }) => {
      const client = await getClient();
      await client.editMessage(BigInt(replyId), {
        __kind__: "text",
        text: newText,
      });
    },
    onSuccess: (_, { postId }) => {
      qc.invalidateQueries({ queryKey: ["feedReplies", postId] });
    },
  });
}

export function useDeleteFeedReply() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ replyId }: { replyId: string; postId: string }) => {
      const client = await getClient();
      await client.deletePost(BigInt(replyId));
    },
    onSuccess: (_, { postId }) => {
      qc.invalidateQueries({ queryKey: ["feedReplies", postId] });
    },
  });
}

// ─── Catalog hooks ────────────────────────────────────────────────────────────

export function useGetCatalogRooms() {
  const { getClient, isReady } = useBackendClient();
  return useQuery<FECatalogRoom[]>({
    queryKey: ["catalogRooms"],
    queryFn: async () => {
      const client = await getClient();
      const results = await client.getCatalogRooms(null);
      return results
        .map(adaptCatalogRoom)
        .sort((a, b) => b.lastActivityAt - a.lastActivityAt);
    },
    enabled: isReady,
    refetchInterval: 15000,
  });
}

export function useGetCatalogRoom(roomId: string | null) {
  const { getClient, isReady } = useBackendClient();
  return useQuery<FECatalogRoom | null>({
    queryKey: ["catalogRoom", roomId],
    queryFn: async () => {
      if (!roomId) return null;
      const client = await getClient();
      const result = await client.getCatalogRoom(BigInt(roomId));
      return result ? adaptCatalogRoom(result) : null;
    },
    enabled: !!roomId && isReady,
  });
}

export function useCreateCatalogRoom() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      description,
      coverImageUrl,
    }: {
      title: string;
      description: string;
      coverImageUrl?: string;
      currentUserId?: string;
    }) => {
      const client = await getClient();
      const result = await client.createCatalogRoom(
        title,
        description,
        coverImageUrl ?? null,
      );
      return adaptCatalogRoom(result);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalogRooms"] });
      qc.invalidateQueries({ queryKey: ["joinedCatalogRooms"] });
    },
  });
}

export function useJoinCatalogRoom() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roomId,
    }: { roomId: string; currentUserId?: string }) => {
      const client = await getClient();
      await client.joinCatalogRoom(BigInt(roomId));
    },
    onSuccess: (_, { roomId }) => {
      qc.invalidateQueries({ queryKey: ["catalogRoom", roomId] });
      qc.invalidateQueries({ queryKey: ["joinedCatalogRooms"] });
    },
  });
}

export function useLeaveCatalogRoom() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roomId,
    }: { roomId: string; currentUserId?: string }) => {
      const client = await getClient();
      await client.leaveCatalogRoom(BigInt(roomId));
    },
    onSuccess: (_, { roomId }) => {
      qc.invalidateQueries({ queryKey: ["catalogRoom", roomId] });
      qc.invalidateQueries({ queryKey: ["joinedCatalogRooms"] });
    },
  });
}

export function useSendCatalogMessage() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roomId,
      text,
      content,
    }: {
      roomId: string;
      text: string;
      content?: MessageContentType;
      mediaUrl?: string;
      currentUserId?: string;
    }) => {
      const client = await getClient();
      if (content && content.kind !== "text") {
        const result = await client.sendCatalogMediaMessage({
          roomId: BigInt(roomId),
          content: toBackendMessageContent(content),
        });
        return adaptCatalogMessage(result);
      }
      // Text message via media endpoint with text content
      const result = await client.sendCatalogMediaMessage({
        roomId: BigInt(roomId),
        content: { __kind__: "text", text },
      });
      return adaptCatalogMessage(result);
    },
    onSuccess: (_, { roomId }) => {
      qc.invalidateQueries({ queryKey: ["catalogMessages", roomId] });
      qc.invalidateQueries({ queryKey: ["catalogRooms"] });
    },
  });
}

export function useGetCatalogMessages(roomId: string | null) {
  const { getClient, isReady } = useBackendClient();
  return useQuery<CatalogMessage[]>({
    queryKey: ["catalogMessages", roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const client = await getClient();
      const results = await client.getCatalogMessages(BigInt(roomId), null);
      return results.map(adaptCatalogMessage);
    },
    enabled: !!roomId && isReady,
    refetchInterval: 5000,
  });
}

export function useDeleteCatalogMessage() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      messageId,
      roomId,
    }: { messageId: string; roomId: string }) => {
      const client = await getClient();
      await client.deleteCatalogMessage(BigInt(roomId), BigInt(messageId));
    },
    onSuccess: (_, { roomId }) => {
      qc.invalidateQueries({ queryKey: ["catalogMessages", roomId] });
    },
  });
}

export function useEditCatalogMessage() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      messageId,
      roomId,
      newText,
    }: {
      messageId: string;
      roomId: string;
      newText: string;
    }) => {
      const client = await getClient();
      await client.editCatalogMessage(
        BigInt(roomId),
        BigInt(messageId),
        newText,
      );
    },
    onSuccess: (_, { roomId }) => {
      qc.invalidateQueries({ queryKey: ["catalogMessages", roomId] });
    },
  });
}

// ─── Catalog reactions ────────────────────────────────────────────────────────

export function useAddCatalogReaction() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      messageId,
      roomId,
      emoji,
    }: {
      messageId: string;
      roomId: string;
      emoji: string;
      currentUserId?: string;
    }) => {
      const client = await getClient();
      await client.addCatalogReaction(BigInt(roomId), BigInt(messageId), emoji);
    },
    onSuccess: (_, { roomId }) => {
      qc.invalidateQueries({ queryKey: ["catalogMessages", roomId] });
    },
  });
}

export function useRemoveCatalogReaction() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      messageId,
      roomId,
      emoji,
    }: {
      messageId: string;
      roomId: string;
      emoji: string;
      currentUserId?: string;
    }) => {
      const client = await getClient();
      await client.removeCatalogReaction(
        BigInt(roomId),
        BigInt(messageId),
        emoji,
      );
    },
    onSuccess: (_, { roomId }) => {
      qc.invalidateQueries({ queryKey: ["catalogMessages", roomId] });
    },
  });
}

// ─── Catalog typing ───────────────────────────────────────────────────────────

export function useSetCatalogTyping() {
  const { getClient } = useBackendClient();
  return useMutation({
    mutationFn: async ({
      roomId,
    }: {
      roomId: string;
      isTyping?: boolean;
      currentUserId?: string;
    }) => {
      const client = await getClient();
      await client.setCatalogTyping(BigInt(roomId));
    },
  });
}

export function useGetCatalogTypingUsers(
  roomId: string | null,
  _currentUserId: string | null,
) {
  const { getClient, isReady } = useBackendClient();
  return useQuery<UserProfile[]>({
    queryKey: ["catalogTyping", roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const client = await getClient();
      const userIds = await client.getCatalogTypingUsers(BigInt(roomId));
      return userIds.map((p) => {
        const id = principalToString(p);
        return {
          id,
          displayName: id.slice(0, 10),
          avatarInitials: id.slice(0, 2).toUpperCase(),
        };
      });
    },
    enabled: !!roomId && isReady,
    refetchInterval: 3000,
  });
}

// ─── Catalog pin ──────────────────────────────────────────────────────────────

export function usePinCatalogMessage() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      messageId,
      roomId,
    }: { messageId: string; roomId: string }) => {
      const client = await getClient();
      await client.pinCatalogMessage(BigInt(roomId), BigInt(messageId));
    },
    onSuccess: (_, { roomId }) => {
      qc.invalidateQueries({ queryKey: ["catalogMessages", roomId] });
    },
  });
}

export function useUnpinCatalogMessage() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      messageId,
      roomId,
    }: { messageId: string; roomId: string }) => {
      const client = await getClient();
      await client.unpinCatalogMessage(BigInt(roomId), BigInt(messageId));
    },
    onSuccess: (_, { roomId }) => {
      qc.invalidateQueries({ queryKey: ["catalogMessages", roomId] });
    },
  });
}

export function useGetPinnedCatalogMessages(roomId: string | null) {
  const { getClient, isReady } = useBackendClient();
  return useQuery<CatalogMessage[]>({
    queryKey: ["catalogPinned", roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const client = await getClient();
      const results = await client.getPinnedCatalogMessages(BigInt(roomId));
      return results.map(adaptCatalogMessage);
    },
    enabled: !!roomId && isReady,
  });
}

// ─── Catalog misc ─────────────────────────────────────────────────────────────

export function useRemoveUserFromCatalogRoom() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roomId,
      userId,
    }: { roomId: string; userId: string }) => {
      const client = await getClient();
      await client.removeUserFromCatalogRoom(
        BigInt(roomId),
        stringToPrincipal(userId),
      );
    },
    onSuccess: (_, { roomId }) => {
      qc.invalidateQueries({ queryKey: ["catalogRoom", roomId] });
    },
  });
}

export function useGetJoinedCatalogRooms() {
  const { getClient, isReady } = useBackendClient();
  return useQuery<FECatalogRoom[]>({
    queryKey: ["joinedCatalogRooms"],
    queryFn: async () => {
      const client = await getClient();
      const results = await client.getJoinedCatalogRooms();
      return results.map(adaptCatalogRoom);
    },
    enabled: isReady,
    refetchInterval: 10000,
  });
}

export function useGetUnreadCatalogCount(roomId: string | null) {
  const { getClient, isReady } = useBackendClient();
  return useQuery<number>({
    queryKey: ["catalogUnread", roomId],
    queryFn: async () => {
      if (!roomId) return 0;
      const client = await getClient();
      const count = await client.getUnreadCatalogCount(BigInt(roomId));
      return bigintToNumber(count);
    },
    enabled: !!roomId && isReady,
    refetchInterval: 15000,
  });
}

export function useMarkCatalogRoomRead() {
  const { getClient } = useBackendClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: string) => {
      const client = await getClient();
      await client.markCatalogRoomRead(BigInt(roomId));
    },
    onSuccess: (_, roomId) => {
      qc.invalidateQueries({ queryKey: ["catalogUnread", roomId] });
    },
  });
}

export function useReportCatalogRoom() {
  const { getClient } = useBackendClient();
  return useMutation({
    mutationFn: async ({
      roomId,
      reason,
    }: { roomId: string; reason: string }) => {
      const client = await getClient();
      await client.reportCatalogRoom(BigInt(roomId), reason);
    },
  });
}

// ─── Shared conversations hook ────────────────────────────────────────────────

export function useGetSharedConversations(targetUserId: UserId | null) {
  const { getClient, isReady } = useBackendClient();
  return useQuery<ConversationSummary[]>({
    queryKey: ["sharedConversations", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const client = await getClient();
      const results = await client.getSharedConversations(
        stringToPrincipal(targetUserId),
      );
      return results.map(adaptConversation);
    },
    enabled: !!targetUserId && isReady,
  });
}

// ─── Cache management ─────────────────────────────────────────────────────────

/** Call on logout to ensure stale clients are not reused. */
export { clearBackendClientCache };

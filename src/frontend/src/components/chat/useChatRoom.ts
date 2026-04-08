import { useCallback, useEffect, useRef } from "react";
import {
  useAddCatalogReaction,
  useAddFeedReaction,
  useAddReaction,
  useAddReply,
  useDeleteCatalogMessage,
  useDeleteFeedReply,
  useDeleteMessage,
  useEditCatalogMessage,
  useEditFeedReply,
  useEditMessage,
  useGetCatalogMessages,
  useGetCatalogTypingUsers,
  useGetFeedTypingUsers,
  useGetMessages,
  useGetPinnedCatalogMessages,
  useGetPinnedMessages,
  useGetPostReplies,
  useGetReactions,
  useGetTypingUsers,
  usePinCatalogMessage,
  usePinFeedReply,
  usePinMessage,
  useRemoveCatalogReaction,
  useRemoveFeedReaction,
  useRemoveReaction,
  useSendCatalogMessage,
  useSendMediaMessage,
  useSendMessage,
  useSetCatalogTyping,
  useSetFeedTyping,
  useSetTyping,
  useUnpinCatalogMessage,
  useUnpinFeedReply,
  useUnpinMessage,
} from "../../hooks/useBackend";
import { useUploadFile } from "../../hooks/useUploadFile";
import type {
  AudioContent,
  CatalogMessage,
  FeedReply,
  ImageContent,
  Message,
  MessageContentType,
  PinnedMessage,
  ReactionGroup,
  RoomType,
  UnifiedMessage,
  UserProfile,
  VideoContent,
} from "../../types";

// ─── Normalisation helpers ────────────────────────────────────────────────────

function normaliseGroupMessage(m: Message): UnifiedMessage {
  return {
    id: m.id,
    senderId: m.senderId,
    senderProfile: m.senderProfile,
    text: m.text,
    content: m.content,
    timestamp: m.timestamp,
    deleted: m.deleted,
    editedAt: m.editedAt,
    pinned: m.pinned,
  };
}

function normaliseCatalogMessage(m: CatalogMessage): UnifiedMessage {
  return {
    id: m.id,
    senderId: m.author,
    senderProfile: undefined,
    text: m.deletedByCreator ? "" : m.text,
    content: m.deletedByCreator ? undefined : m.content,
    // createdAt from backend is a number (decoded from Motoko Int), store as-is
    // so formatTime receives a consistent millisecond timestamp
    timestamp:
      typeof m.createdAt === "bigint" ? m.createdAt : BigInt(m.createdAt),
    deleted: m.deletedByCreator,
    editedAt:
      m.editedAt != null
        ? typeof m.editedAt === "bigint"
          ? m.editedAt
          : BigInt(m.editedAt)
        : undefined,
    pinned: m.pinned,
    reactions: m.reactions,
  };
}

function normaliseFeedReply(r: FeedReply): UnifiedMessage {
  return {
    id: r.id.toString(),
    senderId: r.author.id,
    senderProfile: r.author,
    text: r.text,
    content: r.content,
    timestamp: r.timestamp,
    deleted: false,
    editedAt: r.editedAt,
    pinned: r.pinned,
    reactions: r.reactions,
  };
}

// ─── Pinned message normalisation ─────────────────────────────────────────────

export interface UnifiedPinnedMessage {
  id: string;
  text: string;
  senderName: string;
}

function normalisePinned(
  roomType: RoomType,
  pinned: PinnedMessage[] | CatalogMessage[] | FeedReply[],
): UnifiedPinnedMessage[] {
  if (roomType === "group") {
    return (pinned as PinnedMessage[]).map((p) => ({
      id: p.messageId,
      text: p.message.text,
      senderName: p.message.senderProfile?.displayName ?? p.message.senderId,
    }));
  }
  if (roomType === "catalog") {
    return (pinned as CatalogMessage[]).map((m) => ({
      id: m.id,
      text: m.text,
      senderName: m.author,
    }));
  }
  // feed
  return (pinned as FeedReply[]).map((r) => ({
    id: r.id.toString(),
    text: r.text,
    senderName: r.author.displayName,
  }));
}

// ─── useChatRoom ──────────────────────────────────────────────────────────────

interface UseChatRoomOptions {
  roomType: RoomType;
  roomId: string;
  currentUserId: string;
  currentUserProfile: UserProfile;
  /** Only needed for group rooms — reactions use existing per-message queries */
  enabled?: boolean;
}

export interface ChatRoomReturn {
  messages: UnifiedMessage[];
  isLoading: boolean;
  typingUsers: UserProfile[];
  pinnedMessages: UnifiedPinnedMessage[];
  /** Reactions for a specific message id (group rooms only — catalog/feed inline) */
  useMessageReactions: (messageId: string) => ReactionGroup[];
  sendText: (text: string) => Promise<void>;
  sendMedia: (file: File, caption?: string) => Promise<void>;
  sendVoice: (blob: Blob, durationSecs: number) => Promise<void>;
  sendVideo: (
    blob: Blob,
    durationSecs: number,
    thumbnailBlob?: Blob,
  ) => Promise<void>;
  sendLink: (url: string, text?: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;
  editMessage: (messageId: string, newText: string) => void;
  deleteMessage: (messageId: string) => void;
  pinMessage: (messageId: string) => void;
  unpinMessage: (messageId: string) => void;
  setTyping: (isTyping: boolean) => void;
  refetch: () => void;
}

export function useChatRoom({
  roomType,
  roomId,
  currentUserId,
  currentUserProfile,
}: UseChatRoomOptions): ChatRoomReturn {
  const { upload } = useUploadFile();

  // ── Data queries ─────────────────────────────────────────────────────────────

  const groupMessages = useGetMessages(roomType === "group" ? roomId : null);
  const catalogMessages = useGetCatalogMessages(
    roomType === "catalog" ? roomId : null,
  );
  const feedReplies = useGetPostReplies(
    roomType === "feed" ? BigInt(roomId) : null,
  );

  const groupTyping = useGetTypingUsers(
    roomType === "group" ? roomId : null,
    currentUserId,
  );
  const catalogTyping = useGetCatalogTypingUsers(
    roomType === "catalog" ? roomId : null,
    currentUserId,
  );
  const feedTyping = useGetFeedTypingUsers(
    roomType === "feed" ? roomId : null,
    currentUserId,
  );

  const groupPinned = useGetPinnedMessages(
    roomType === "group" ? roomId : null,
  );
  const catalogPinned = useGetPinnedCatalogMessages(
    roomType === "catalog" ? roomId : null,
  );

  // ── Mutations ────────────────────────────────────────────────────────────────

  const sendGroupText = useSendMessage();
  const sendGroupMedia = useSendMediaMessage();
  const deleteGroupMsg = useDeleteMessage();
  const editGroupMsg = useEditMessage();
  const pinGroupMsg = usePinMessage();
  const unpinGroupMsg = useUnpinMessage();
  const setGroupTyping = useSetTyping();
  const addGroupReaction = useAddReaction();
  const removeGroupReaction = useRemoveReaction();

  const sendCatalogMsg = useSendCatalogMessage();
  const deleteCatalogMsg = useDeleteCatalogMessage();
  const editCatalogMsg = useEditCatalogMessage();
  const pinCatalogMsg = usePinCatalogMessage();
  const unpinCatalogMsg = useUnpinCatalogMessage();
  const setCatalogTyping = useSetCatalogTyping();
  const addCatalogReaction = useAddCatalogReaction();
  const removeCatalogReaction = useRemoveCatalogReaction();

  const sendFeedReply = useAddReply();
  const deleteFeedReply = useDeleteFeedReply();
  const editFeedReply = useEditFeedReply();
  const pinFeedReply = usePinFeedReply();
  const unpinFeedReply = useUnpinFeedReply();
  const setFeedTyping = useSetFeedTyping();
  const addFeedReaction = useAddFeedReaction();
  const removeFeedReaction = useRemoveFeedReaction();

  // ── Typing cleanup on unmount ─────────────────────────────────────────────────

  const isTypingRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable refs so cleanup effect doesn't need mutate functions as deps
  const groupTypingMutateRef = useRef(setGroupTyping.mutate);
  groupTypingMutateRef.current = setGroupTyping.mutate;
  const catalogTypingMutateRef = useRef(setCatalogTyping.mutate);
  catalogTypingMutateRef.current = setCatalogTyping.mutate;
  const feedTypingMutateRef = useRef(setFeedTyping.mutate);
  feedTypingMutateRef.current = setFeedTyping.mutate;

  useEffect(() => {
    return () => {
      if (isTypingRef.current) {
        if (roomType === "group") {
          groupTypingMutateRef.current({
            conversationId: roomId,
            isTyping: false,
            currentUserId,
          });
        } else if (roomType === "catalog") {
          catalogTypingMutateRef.current({
            roomId,
            isTyping: false,
            currentUserId,
          });
        } else {
          feedTypingMutateRef.current({
            postId: roomId,
            isTyping: false,
            currentUserId,
          });
        }
        isTypingRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomType, roomId, currentUserId]);

  // ── Derived data ──────────────────────────────────────────────────────────────

  const messages: UnifiedMessage[] =
    roomType === "group"
      ? (groupMessages.data?.messages ?? []).map(normaliseGroupMessage)
      : roomType === "catalog"
        ? (catalogMessages.data ?? []).map(normaliseCatalogMessage)
        : (feedReplies.data ?? []).map(normaliseFeedReply);

  const isLoading =
    roomType === "group"
      ? groupMessages.isLoading
      : roomType === "catalog"
        ? catalogMessages.isLoading
        : feedReplies.isLoading;

  const typingUsers: UserProfile[] =
    roomType === "group"
      ? (groupTyping.data ?? [])
      : roomType === "catalog"
        ? (catalogTyping.data ?? [])
        : (feedTyping.data ?? []);

  const rawPinned =
    roomType === "group"
      ? (groupPinned.data ?? [])
      : roomType === "catalog"
        ? (catalogPinned.data ?? [])
        : [];
  const pinnedMessages = normalisePinned(
    roomType,
    rawPinned as Parameters<typeof normalisePinned>[1],
  );

  // ── Hooks for per-message reactions (group only; catalog/feed inline in data) ─

  // We expose a stable hook factory so callers can use it in child components
  const useMessageReactions = useCallback(
    (_messageId: string): ReactionGroup[] => {
      // This is called from within ChatMessageBubble which manages its own useGetReactions
      // For catalog/feed, reactions are embedded in the message object itself
      return [];
    },
    [],
  );

  // ── Upload helper ────────────────────────────────────────────────────────────

  const uploadAndGetContent = useCallback(
    async (
      file: File,
      kind: "image" | "video" | "audio",
    ): Promise<MessageContentType> => {
      const url = await upload(file);
      // Validate that the URL is persistent before saving to the backend
      if (!url.startsWith("https://")) {
        throw new Error(
          `Upload returned a temporary URL for ${kind} — storage upload failed.`,
        );
      }
      if (kind === "image") {
        return {
          kind: "image",
          image: {
            url,
            mimeType: file.type,
            fileSize: file.size,
          } satisfies ImageContent,
        };
      }
      if (kind === "video") {
        return {
          kind: "video",
          video: {
            url,
            mimeType: file.type,
            fileSize: file.size,
          } satisfies VideoContent,
        };
      }
      return {
        kind: "audio",
        audio: {
          url,
          mimeType: file.type,
          fileSize: file.size,
        } satisfies AudioContent,
      };
    },
    [upload],
  );

  // ── Send operations ───────────────────────────────────────────────────────────

  const sendText = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      if (roomType === "group") {
        sendGroupText.mutate({
          conversationId: roomId,
          text,
          currentUserId,
          currentUserInitials: currentUserProfile.avatarInitials,
        });
      } else if (roomType === "catalog") {
        sendCatalogMsg.mutate({ roomId, text, currentUserId });
      } else {
        sendFeedReply.mutate({
          postId: BigInt(roomId),
          text,
          currentUserProfile,
        });
      }
    },
    [
      roomType,
      roomId,
      currentUserId,
      currentUserProfile,
      sendGroupText,
      sendCatalogMsg,
      sendFeedReply,
    ],
  );

  const sendMedia = useCallback(
    async (file: File, caption = "") => {
      const mimeType = file.type;
      const kind = mimeType.startsWith("image/")
        ? "image"
        : mimeType.startsWith("video/")
          ? "video"
          : "audio";
      const content = await uploadAndGetContent(file, kind);
      if (roomType === "group") {
        sendGroupMedia.mutate({
          conversationId: roomId,
          text: caption,
          content,
          currentUserId,
          currentUserInitials: currentUserProfile.avatarInitials,
        });
      } else if (roomType === "catalog") {
        sendCatalogMsg.mutate({
          roomId,
          text: caption,
          content,
          currentUserId,
        });
      } else {
        sendFeedReply.mutate({
          postId: BigInt(roomId),
          text: caption,
          content,
          currentUserProfile,
        });
      }
    },
    [
      roomType,
      roomId,
      currentUserId,
      currentUserProfile,
      uploadAndGetContent,
      sendGroupMedia,
      sendCatalogMsg,
      sendFeedReply,
    ],
  );

  const sendVoice = useCallback(
    async (blob: Blob, durationSecs: number) => {
      const file = new File([blob], `voice-${Date.now()}.webm`, {
        type: blob.type || "audio/webm",
      });
      // Will throw if upload fails — callers should catch and surface error to user
      const url = await upload(file);
      if (!url.startsWith("https://")) {
        throw new Error(
          "Voice upload returned a temporary URL — upload failed.",
        );
      }
      const content: MessageContentType = {
        kind: "audio",
        audio: {
          url,
          mimeType: file.type,
          fileSize: file.size,
          duration: durationSecs,
        } satisfies AudioContent,
      };
      if (roomType === "group") {
        sendGroupMedia.mutate({
          conversationId: roomId,
          text: "🎙 Voice message",
          content,
          currentUserId,
          currentUserInitials: currentUserProfile.avatarInitials,
        });
      } else if (roomType === "catalog") {
        sendCatalogMsg.mutate({
          roomId,
          text: "🎙 Voice message",
          content,
          currentUserId,
        });
      } else {
        sendFeedReply.mutate({
          postId: BigInt(roomId),
          text: "🎙 Voice message",
          content,
          currentUserProfile,
        });
      }
    },
    [
      roomType,
      roomId,
      currentUserId,
      currentUserProfile,
      upload,
      sendGroupMedia,
      sendCatalogMsg,
      sendFeedReply,
    ],
  );

  const sendVideo = useCallback(
    async (blob: Blob, durationSecs: number, thumbnailBlob?: Blob) => {
      const file = new File([blob], `video-${Date.now()}.webm`, {
        type: blob.type || "video/webm",
      });
      // Will throw if upload fails — callers should catch and surface error to user
      const url = await upload(file);
      if (!url.startsWith("https://")) {
        throw new Error(
          "Video upload returned a temporary URL — upload failed.",
        );
      }

      // Upload thumbnail blob if provided, so the URL persists
      let thumbnailUrl: string | undefined;
      if (thumbnailBlob) {
        try {
          const thumbFile = new File(
            [thumbnailBlob],
            `thumb-${Date.now()}.jpg`,
            {
              type: "image/jpeg",
            },
          );
          thumbnailUrl = await upload(thumbFile);
        } catch {
          // Thumbnail upload failure is non-fatal — video still sends without it
          thumbnailUrl = undefined;
        }
      }

      const content: MessageContentType = {
        kind: "video",
        video: {
          url,
          mimeType: file.type,
          fileSize: file.size,
          duration: durationSecs,
          thumbnailUrl,
        } satisfies VideoContent,
      };
      if (roomType === "group") {
        sendGroupMedia.mutate({
          conversationId: roomId,
          text: "🎬 Video message",
          content,
          currentUserId,
          currentUserInitials: currentUserProfile.avatarInitials,
        });
      } else if (roomType === "catalog") {
        sendCatalogMsg.mutate({
          roomId,
          text: "🎬 Video message",
          content,
          currentUserId,
        });
      } else {
        sendFeedReply.mutate({
          postId: BigInt(roomId),
          text: "🎬 Video message",
          content,
          currentUserProfile,
        });
      }
    },
    [
      roomType,
      roomId,
      currentUserId,
      currentUserProfile,
      upload,
      sendGroupMedia,
      sendCatalogMsg,
      sendFeedReply,
    ],
  );

  const sendLink = useCallback(
    async (url: string, text = "") => {
      const content: MessageContentType = {
        kind: "link",
        link: { url },
      };
      if (roomType === "group") {
        sendGroupMedia.mutate({
          conversationId: roomId,
          text: text || url,
          content,
          currentUserId,
          currentUserInitials: currentUserProfile.avatarInitials,
        });
      } else if (roomType === "catalog") {
        sendCatalogMsg.mutate({
          roomId,
          text: text || url,
          content,
          currentUserId,
        });
      } else {
        sendFeedReply.mutate({
          postId: BigInt(roomId),
          text: text || url,
          content,
          currentUserProfile,
        });
      }
    },
    [
      roomType,
      roomId,
      currentUserId,
      currentUserProfile,
      sendGroupMedia,
      sendCatalogMsg,
      sendFeedReply,
    ],
  );

  // ── Reactions ─────────────────────────────────────────────────────────────────

  const addReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (roomType === "group") {
        addGroupReaction.mutate({ messageId, emoji, currentUserId });
      } else if (roomType === "catalog") {
        addCatalogReaction.mutate({
          messageId,
          roomId,
          emoji,
          currentUserId,
        });
      } else {
        addFeedReaction.mutate({
          replyId: messageId,
          postId: roomId,
          emoji,
          currentUserId,
        });
      }
    },
    [
      roomType,
      roomId,
      currentUserId,
      addGroupReaction,
      addCatalogReaction,
      addFeedReaction,
    ],
  );

  const removeReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (roomType === "group") {
        removeGroupReaction.mutate({ messageId, emoji, currentUserId });
      } else if (roomType === "catalog") {
        removeCatalogReaction.mutate({
          messageId,
          roomId,
          emoji,
          currentUserId,
        });
      } else {
        removeFeedReaction.mutate({
          replyId: messageId,
          postId: roomId,
          emoji,
          currentUserId,
        });
      }
    },
    [
      roomType,
      roomId,
      currentUserId,
      removeGroupReaction,
      removeCatalogReaction,
      removeFeedReaction,
    ],
  );

  // ── Edit / delete / pin ───────────────────────────────────────────────────────

  const editMessage = useCallback(
    (messageId: string, newText: string) => {
      if (roomType === "group") {
        editGroupMsg.mutate({
          messageId,
          conversationId: roomId,
          newText,
        });
      } else if (roomType === "catalog") {
        editCatalogMsg.mutate({ messageId, roomId, newText });
      } else {
        editFeedReply.mutate({ replyId: messageId, postId: roomId, newText });
      }
    },
    [roomType, roomId, editGroupMsg, editCatalogMsg, editFeedReply],
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (roomType === "group") {
        deleteGroupMsg.mutate({ messageId, conversationId: roomId });
      } else if (roomType === "catalog") {
        deleteCatalogMsg.mutate({ messageId, roomId });
      } else {
        deleteFeedReply.mutate({ replyId: messageId, postId: roomId });
      }
    },
    [roomType, roomId, deleteGroupMsg, deleteCatalogMsg, deleteFeedReply],
  );

  const pinMessage = useCallback(
    (messageId: string) => {
      if (roomType === "group") {
        pinGroupMsg.mutate({
          messageId,
          conversationId: roomId,
          currentUserId,
        });
      } else if (roomType === "catalog") {
        pinCatalogMsg.mutate({ messageId, roomId });
      } else {
        pinFeedReply.mutate({ replyId: messageId, postId: roomId });
      }
    },
    [roomType, roomId, currentUserId, pinGroupMsg, pinCatalogMsg, pinFeedReply],
  );

  const unpinMessage = useCallback(
    (messageId: string) => {
      if (roomType === "group") {
        unpinGroupMsg.mutate({ messageId, conversationId: roomId });
      } else if (roomType === "catalog") {
        unpinCatalogMsg.mutate({ messageId, roomId });
      } else {
        unpinFeedReply.mutate({ replyId: messageId, postId: roomId });
      }
    },
    [roomType, roomId, unpinGroupMsg, unpinCatalogMsg, unpinFeedReply],
  );

  // ── Typing ────────────────────────────────────────────────────────────────────

  const setTyping = useCallback(
    (isTyping: boolean) => {
      isTypingRef.current = isTyping;
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (isTyping) {
        typingTimerRef.current = setTimeout(() => {
          isTypingRef.current = false;
          if (roomType === "group") {
            setGroupTyping.mutate({
              conversationId: roomId,
              isTyping: false,
              currentUserId,
            });
          } else if (roomType === "catalog") {
            setCatalogTyping.mutate({ roomId, isTyping: false, currentUserId });
          } else {
            setFeedTyping.mutate({
              postId: roomId,
              isTyping: false,
              currentUserId,
            });
          }
        }, 3000);
      }
      if (roomType === "group") {
        setGroupTyping.mutate({
          conversationId: roomId,
          isTyping,
          currentUserId,
        });
      } else if (roomType === "catalog") {
        setCatalogTyping.mutate({ roomId, isTyping, currentUserId });
      } else {
        setFeedTyping.mutate({ postId: roomId, isTyping, currentUserId });
      }
    },
    [
      roomType,
      roomId,
      currentUserId,
      setGroupTyping,
      setCatalogTyping,
      setFeedTyping,
    ],
  );

  // ── Refetch ───────────────────────────────────────────────────────────────────

  const refetch = useCallback(() => {
    if (roomType === "group") groupMessages.refetch();
    else if (roomType === "catalog") catalogMessages.refetch();
    else feedReplies.refetch();
  }, [roomType, groupMessages, catalogMessages, feedReplies]);

  return {
    messages,
    isLoading,
    typingUsers,
    pinnedMessages,
    useMessageReactions,
    sendText,
    sendMedia,
    sendVoice,
    sendVideo,
    sendLink,
    addReaction,
    removeReaction,
    editMessage,
    deleteMessage,
    pinMessage,
    unpinMessage,
    setTyping,
    refetch,
  };
}

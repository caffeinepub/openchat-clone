import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Pin,
  PinOff,
  Send,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useState } from "react";
import { AvatarBubble } from "../components/Sidebar";
import { ChatComposeBar } from "../components/chat/ChatComposeBar";
import { ChatMessageBubble } from "../components/chat/ChatMessageBubble";
import { useChatRoom } from "../components/chat/useChatRoom";
import { useAuth } from "../hooks/useAuth";
import {
  useListConversations,
  useMarkConversationRead,
} from "../hooks/useBackend";
import { useUploadFile } from "../hooks/useUploadFile";
import type { UnifiedMessage } from "../types";

// ─── Skeletons & empty state ──────────────────────────────────────────────────

function MessageSkeletons() {
  return (
    <div className="space-y-5 px-4 py-4">
      <div className="flex gap-3">
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0 mt-4" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-14 w-56 rounded-2xl rounded-bl-sm" />
        </div>
      </div>
      <div className="flex flex-row-reverse gap-3">
        <div className="space-y-2 items-end flex flex-col">
          <Skeleton className="h-10 w-48 rounded-2xl rounded-br-sm" />
        </div>
      </div>
      <div className="flex gap-3">
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0 mt-4" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-72 rounded-2xl rounded-bl-sm" />
        </div>
      </div>
    </div>
  );
}

function EmptyMessages() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full text-center px-8"
      data-ocid="empty-messages"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
        <Send className="w-7 h-7 text-primary/50" />
      </div>
      <p className="font-display font-semibold text-foreground text-sm">
        No messages yet
      </p>
      <p className="text-[13px] text-muted-foreground mt-1.5">
        Say hello to start the conversation
      </p>
    </div>
  );
}

// ─── Pinned messages panel ────────────────────────────────────────────────────

function PinnedMessagesPanel({
  pinned,
  onUnpin,
}: {
  pinned: { id: string; text: string; senderName: string }[];
  onUnpin: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (pinned.length === 0) return null;

  return (
    <div
      className="border-b border-border bg-card/80 flex-shrink-0"
      data-ocid="pinned-messages-panel"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2 text-[13px] font-display font-semibold text-muted-foreground hover:text-foreground transition-colors-fast"
        data-ocid="pinned-toggle-btn"
      >
        <Pin className="w-3 h-3 text-primary/70" />
        <span className="text-primary/80">
          {pinned.length} pinned message{pinned.length > 1 ? "s" : ""}
        </span>
        <div className="flex-1" />
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
          {pinned.map((p) => (
            <div
              key={p.id}
              className="flex items-start gap-2 rounded-lg bg-muted/40 border border-border px-3 py-2 group"
            >
              <Pin className="w-3 h-3 text-primary/50 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-display font-semibold text-foreground mb-0.5">
                  {p.senderName}
                </p>
                <p className="text-[13px] text-foreground truncate">{p.text}</p>
              </div>
              <button
                type="button"
                aria-label="Unpin message"
                onClick={() => onUnpin(p.id)}
                className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors-fast flex-shrink-0"
                data-ocid="unpin-btn"
              >
                <PinOff className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ConversationDetailPage() {
  const { id } = useParams({ from: "/conversations/$id" });
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const { data: convList } = useListConversations();
  const conversation = convList?.find((c) => c.id === id);

  const markRead = useMarkConversationRead();
  const markReadMutate = markRead.mutate;
  useEffect(() => {
    markReadMutate(id);
  }, [id, markReadMutate]);

  const currentUserId = currentUser?.id ?? "me";
  const currentUserProfile = currentUser ?? {
    id: currentUserId,
    displayName: "me",
    avatarInitials: "ME",
  };

  const chatRoom = useChatRoom({
    roomType: "group",
    roomId: id,
    currentUserId,
    currentUserProfile,
  });

  const [showMembers, setShowMembers] = useState(false);

  const { upload } = useUploadFile();

  // Auto-scroll to bottom when new messages arrive
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const messageCount = chatRoom.messages.length;
  if (prevCountRef.current !== messageCount) {
    prevCountRef.current = messageCount;
    Promise.resolve().then(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Poll for new messages
  useEffect(() => {
    const timer = setInterval(() => chatRoom.refetch(), 3000);
    return () => clearInterval(timer);
  }, [chatRoom.refetch]);

  // ── Compose bar handlers ────────────────────────────────────────────────────

  const handleSendText = useCallback(
    async (text: string) => {
      await chatRoom.sendText(text);
    },
    [chatRoom.sendText],
  );

  const handleSendMedia = useCallback(
    async (file: File, caption: string) => {
      await chatRoom.sendMedia(file, caption);
    },
    [chatRoom.sendMedia],
  );

  const handleSendVoice = useCallback(
    async (blob: Blob, durationSecs: number) => {
      await chatRoom.sendVoice(blob, durationSecs);
    },
    [chatRoom.sendVoice],
  );

  const handleSendVideo = useCallback(
    async (blob: Blob, durationSecs: number, thumbnailBlob?: Blob) => {
      await chatRoom.sendVideo(blob, durationSecs, thumbnailBlob);
    },
    [chatRoom.sendVideo],
  );

  const handleSendLink = useCallback(
    async (url: string, caption: string) => {
      await chatRoom.sendLink(url, caption);
    },
    [chatRoom.sendLink],
  );

  const handleTypingChange = useCallback(
    (isTyping: boolean) => {
      chatRoom.setTyping(isTyping);
    },
    [chatRoom.setTyping],
  );

  // ── Message action handlers ─────────────────────────────────────────────────

  const handleDelete = useCallback(
    (msg: UnifiedMessage) => {
      chatRoom.deleteMessage(msg.id);
    },
    [chatRoom.deleteMessage],
  );

  const handleEdit = useCallback(
    (msg: UnifiedMessage, newText: string) => {
      chatRoom.editMessage(msg.id, newText);
    },
    [chatRoom.editMessage],
  );

  const handlePin = useCallback(
    (msg: UnifiedMessage) => {
      chatRoom.pinMessage(msg.id);
    },
    [chatRoom.pinMessage],
  );

  const handleUnpin = useCallback(
    (msg: UnifiedMessage) => {
      chatRoom.unpinMessage(msg.id);
    },
    [chatRoom.unpinMessage],
  );

  const handleAddReaction = useCallback(
    (msg: UnifiedMessage, emoji: string) => {
      chatRoom.addReaction(msg.id, emoji);
    },
    [chatRoom.addReaction],
  );

  const handleRemoveReaction = useCallback(
    (msg: UnifiedMessage, emoji: string) => {
      chatRoom.removeReaction(msg.id, emoji);
    },
    [chatRoom.removeReaction],
  );

  // ── Derived UI values ───────────────────────────────────────────────────────

  const convName = conversation?.name ?? "Conversation";
  const convInitials = convName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0"
        data-ocid="conv-header"
      >
        <button
          type="button"
          onClick={() => navigate({ to: "/conversations" })}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast md:hidden flex-shrink-0"
          aria-label="Back to conversations"
          data-ocid="back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <AvatarBubble initials={convInitials} size="md" />

        <div className="flex-1 min-w-0">
          <h1 className="font-display font-semibold text-sm text-foreground truncate">
            {convName}
          </h1>
          {conversation?.type === "group" && (
            <p className="text-[13px] text-muted-foreground">
              {conversation.memberIds.length} members
            </p>
          )}
          {conversation?.type === "direct" && (
            <p className="text-[13px] text-primary/70">Active now</p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {conversation?.type === "group" && (
            <button
              type="button"
              aria-label="View members"
              data-ocid="view-members-btn"
              onClick={() => setShowMembers((v) => !v)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast"
            >
              <Users className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            aria-label="More options"
            data-ocid="conv-more-options"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Pinned messages panel ── */}
      <PinnedMessagesPanel
        pinned={chatRoom.pinnedMessages}
        onUnpin={(id) => chatRoom.unpinMessage(id)}
      />

      {/* ── Members panel ── */}
      {showMembers && conversation?.type === "group" && (
        <div
          className="border-b border-border bg-card/80 px-4 py-3 flex-shrink-0"
          data-ocid="members-panel"
        >
          <p className="text-[13px] font-display font-semibold text-muted-foreground mb-2">
            Members ({conversation.memberIds.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {conversation.memberIds.map((memberId) => (
              <span
                key={memberId}
                className="text-[13px] bg-muted rounded-full px-2.5 py-1 text-foreground"
              >
                {memberId}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div
        className="flex-1 overflow-y-auto scrollbar-thin bg-background"
        data-ocid="messages-list"
      >
        {chatRoom.isLoading ? (
          <MessageSkeletons />
        ) : !chatRoom.messages.length ? (
          <EmptyMessages />
        ) : (
          <div className="px-4 py-4 space-y-3">
            {chatRoom.messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === currentUserId || msg.senderId === "me"}
                currentUserId={currentUserId}
                roomType="group"
                showProfileLink={true}
                onDelete={() => handleDelete(msg)}
                onEdit={(newText) => handleEdit(msg, newText)}
                onPin={() => handlePin(msg)}
                onUnpin={() => handleUnpin(msg)}
                onAddReaction={(emoji) => handleAddReaction(msg, emoji)}
                onRemoveReaction={(emoji) => handleRemoveReaction(msg, emoji)}
              />
            ))}
            <div ref={bottomRef} className="h-2" />
          </div>
        )}
      </div>

      {/* ── Compose bar ── */}
      <ChatComposeBar
        typingUsers={chatRoom.typingUsers}
        uploadFile={upload}
        onSendText={handleSendText}
        onSendMedia={handleSendMedia}
        onSendVoice={handleSendVoice}
        onSendVideo={handleSendVideo}
        onSendLink={handleSendLink}
        onTypingChange={handleTypingChange}
      />
    </div>
  );
}

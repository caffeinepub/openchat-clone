import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Flag, Pin, Users, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useState } from "react";
import { AvatarBubble } from "../components/Sidebar";
import { ChatComposeBar } from "../components/chat/ChatComposeBar";
import { ChatMessageBubble } from "../components/chat/ChatMessageBubble";
import { useChatRoom } from "../components/chat/useChatRoom";
import { useAuth } from "../hooks/useAuth";
import {
  useGetCatalogRoom,
  useJoinCatalogRoom,
  useMarkCatalogRoomRead,
  useRemoveUserFromCatalogRoom,
  useReportCatalogRoom,
} from "../hooks/useBackend";
import { useUploadFile } from "../hooks/useUploadFile";
import type { CatalogRoom } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function getInitials(userId: string): string {
  const parts = userId.split("-");
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : userId.slice(0, 2).toUpperCase();
}

function getDisplayName(userId: string): string {
  const parts = userId.split("-");
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : userId.slice(0, 10);
}

// ─── Room header ──────────────────────────────────────────────────────────────

function RoomHeader({
  room,
  onBack,
  onReport,
  onShowMembers,
}: {
  room: CatalogRoom;
  onBack: () => void;
  onReport: () => void;
  onShowMembers: () => void;
}) {
  const initials = room.title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="flex-shrink-0 bg-card border-b border-border"
      data-ocid="catalog-room-header"
    >
      {room.coverImageUrl && (
        <div className="w-full h-20 overflow-hidden relative">
          <img
            src={room.coverImageUrl}
            alt={room.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/80" />
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast flex-shrink-0"
          aria-label="Back to Catalog"
          data-ocid="back-to-catalog-btn"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {!room.coverImageUrl && (
          <div className="flex-shrink-0">
            <AvatarBubble initials={initials} size="md" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="font-display font-semibold text-sm text-foreground truncate">
            {room.title}
          </h1>
          <p className="text-[13px] text-muted-foreground truncate max-w-xs">
            {room.description}
          </p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onShowMembers}
            aria-label="View members"
            data-ocid="view-members-btn"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onReport}
            aria-label="Report room"
            data-ocid="report-room-btn"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors-fast"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 pb-3 text-[13px] text-muted-foreground flex-wrap">
        <span>
          Created by{" "}
          <span className="text-primary/80 font-medium">
            {getDisplayName(room.creator)}
          </span>
        </span>
        <span className="text-border">·</span>
        <span>{room.members.length} members</span>
        <span className="text-border">·</span>
        <span>{room.messageCount} messages</span>
        <span className="text-border">·</span>
        <span>Active {relativeTime(room.lastActivityAt)}</span>
      </div>
    </div>
  );
}

// ─── Pinned bar ───────────────────────────────────────────────────────────────

function PinnedBar({ text, senderName }: { text: string; senderName: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b border-primary/10 flex-shrink-0">
      <Pin className="w-3 h-3 text-primary/60 flex-shrink-0" />
      <span className="text-xs text-muted-foreground truncate">
        <span className="font-medium text-primary/70">{senderName}:</span>{" "}
        {text}
      </span>
    </div>
  );
}

// ─── Members panel ─────────────────────────────────────────────────────────────

function MembersPanel({
  room,
  currentUserId,
  onClose,
  onRemoveUser,
}: {
  room: CatalogRoom;
  currentUserId: string;
  onClose: () => void;
  onRemoveUser: (userId: string) => void;
}) {
  const isCreator = currentUserId === room.creator;

  return (
    <div
      className="absolute inset-0 z-20 bg-background/95 backdrop-blur-sm flex flex-col"
      data-ocid="members-panel"
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast"
          aria-label="Close members panel"
          data-ocid="close-members-btn"
        >
          <X className="w-4 h-4" />
        </button>
        <h2 className="font-display font-semibold text-sm text-foreground">
          Members ({room.members.length})
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-1">
        {room.members.map((memberId) => {
          const initials = getInitials(memberId);
          const displayName = getDisplayName(memberId);
          const isRoomCreator = memberId === room.creator;
          const isSelf = memberId === currentUserId;

          return (
            <div
              key={memberId}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors-fast group"
              data-ocid={`member-row-${memberId}`}
            >
              <AvatarBubble initials={initials} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-display font-medium text-foreground truncate">
                  {displayName}
                  {isSelf && (
                    <span className="text-xs text-muted-foreground ml-1.5">
                      (you)
                    </span>
                  )}
                </p>
                {isRoomCreator && (
                  <p className="text-[13px] text-primary/70">Room creator</p>
                )}
              </div>

              {isCreator && !isSelf && !isRoomCreator && (
                <button
                  type="button"
                  onClick={() => onRemoveUser(memberId)}
                  aria-label={`Remove ${displayName}`}
                  data-ocid={`remove-user-${memberId}`}
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors-fast flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function RoomHeaderSkeleton() {
  return (
    <div className="flex-shrink-0 bg-card border-b border-border px-4 py-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-2.5 w-56" />
        </div>
      </div>
    </div>
  );
}

function MessageSkeletons() {
  return (
    <div className="space-y-5 px-4 py-4">
      <div className="flex gap-3">
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0 mt-4" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-56 rounded-2xl rounded-bl-sm" />
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
          <Skeleton className="h-8 w-64 rounded-2xl rounded-bl-sm" />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CatalogRoomPage() {
  const { roomId } = useParams({ from: "/catalog/$roomId" });
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { upload } = useUploadFile();

  const {
    data: room,
    isLoading: roomLoading,
    refetch: refetchRoom,
  } = useGetCatalogRoom(roomId);

  const markRead = useMarkCatalogRoomRead();
  const joinRoom = useJoinCatalogRoom();
  const removeUser = useRemoveUserFromCatalogRoom();
  const reportRoom = useReportCatalogRoom();

  const [showMembers, setShowMembers] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Mark as read on mount
  const markReadMutate = markRead.mutate;
  useEffect(() => {
    markReadMutate(roomId);
  }, [roomId, markReadMutate]);

  // Auto-join if not already a member
  const joinRoomMutate = joinRoom.mutate;
  useEffect(() => {
    if (!room || !currentUser) return;
    if (!room.members.includes(currentUser.id)) {
      joinRoomMutate({ roomId, currentUserId: currentUser.id });
    }
  }, [room, currentUser, roomId, joinRoomMutate]);

  // Report toast auto-dismiss
  useEffect(() => {
    if (!showReport) return;
    const t = setTimeout(() => setShowReport(false), 4000);
    return () => clearTimeout(t);
  }, [showReport]);

  // Poll room data for member count updates
  useEffect(() => {
    const timer = setInterval(() => refetchRoom(), 10_000);
    return () => clearInterval(timer);
  }, [refetchRoom]);

  // useChatRoom — full feature-parity catalog hook
  const {
    messages,
    isLoading: messagesLoading,
    typingUsers,
    pinnedMessages,
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
    refetch: refetchMessages,
  } = useChatRoom({
    roomType: "catalog",
    roomId,
    currentUserId: currentUser?.id ?? "",
    currentUserProfile: currentUser ?? {
      id: "",
      displayName: "",
      avatarInitials: "?",
    },
  });

  // Auto-scroll on new messages
  const messageCount = messages.length;
  const prevCountRef = useRef(0);
  if (prevCountRef.current !== messageCount) {
    prevCountRef.current = messageCount;
    Promise.resolve().then(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Poll messages every 3s
  useEffect(() => {
    const timer = setInterval(() => refetchMessages(), 3000);
    return () => clearInterval(timer);
  }, [refetchMessages]);

  // Mark read when new messages arrive
  const markReadRef = useRef(markReadMutate);
  markReadRef.current = markReadMutate;
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;
  useEffect(() => {
    if (messageCount > 0) markReadRef.current(roomIdRef.current);
  }, [messageCount]);

  const isCreator = currentUser?.id === room?.creator;

  const handleRemoveUser = (userId: string) => {
    removeUser.mutate({ roomId, userId });
    setShowMembers(false);
  };

  const handleReport = () => {
    reportRoom.mutate({ roomId, reason: "reported" });
    setShowReport(true);
  };

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden relative"
      data-ocid="catalog-room-page"
    >
      {/* ── Members panel overlay ── */}
      {showMembers && room && currentUser && (
        <MembersPanel
          room={room}
          currentUserId={currentUser.id}
          onClose={() => setShowMembers(false)}
          onRemoveUser={handleRemoveUser}
        />
      )}

      {/* ── Room header ── */}
      {roomLoading ? (
        <RoomHeaderSkeleton />
      ) : room ? (
        <RoomHeader
          room={room}
          onBack={() => navigate({ to: "/catalog" })}
          onReport={handleReport}
          onShowMembers={() => setShowMembers(true)}
        />
      ) : (
        <div className="flex-shrink-0 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/catalog" })}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast"
            aria-label="Back to Catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground">Room not found</span>
        </div>
      )}

      {/* ── Pinned messages bar ── */}
      {pinnedMessages.length > 0 && (
        <PinnedBar
          text={pinnedMessages[pinnedMessages.length - 1].text}
          senderName={pinnedMessages[pinnedMessages.length - 1].senderName}
        />
      )}

      {/* ── Report toast ── */}
      {showReport && (
        <div className="flex-shrink-0 mx-4 mt-2">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border text-xs text-muted-foreground"
            data-ocid="report-toast"
          >
            <Flag className="w-3 h-3 text-primary/60 flex-shrink-0" />
            <span>Room reported. Our team will review it shortly.</span>
            <button
              type="button"
              onClick={() => setShowReport(false)}
              aria-label="Dismiss"
              className="text-muted-foreground/50 hover:text-foreground transition-colors-fast ml-auto"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div
        className="flex-1 overflow-y-auto scrollbar-thin bg-background"
        data-ocid="catalog-messages-list"
      >
        {messagesLoading ? (
          <MessageSkeletons />
        ) : messages.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-full text-center px-8"
            data-ocid="empty-catalog-messages"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Flag className="w-6 h-6 text-primary/50" />
            </div>
            <p className="font-display font-semibold text-foreground text-sm">
              No messages yet
            </p>
            <p className="text-[13px] text-muted-foreground mt-1.5">
              Be the first to start the conversation
            </p>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-3">
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === currentUser?.id}
                currentUserId={currentUser?.id ?? ""}
                roomType="catalog"
                isRoomCreator={isCreator}
                showProfileLink={false}
                inlineReactions={msg.reactions}
                onDelete={() => deleteMessage(msg.id)}
                onEdit={(newText) => editMessage(msg.id, newText)}
                onPin={() => pinMessage(msg.id)}
                onUnpin={() => unpinMessage(msg.id)}
                onAddReaction={(emoji) => addReaction(msg.id, emoji)}
                onRemoveReaction={(emoji) => removeReaction(msg.id, emoji)}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* ── Compose bar (full parity with group chats) ── */}
      <ChatComposeBar
        placeholder="Send a message…"
        typingUsers={typingUsers}
        uploadFile={upload}
        onSendText={sendText}
        onSendMedia={sendMedia}
        onSendVoice={sendVoice}
        onSendVideo={sendVideo}
        onSendLink={sendLink}
        onTypingChange={setTyping}
      />
    </div>
  );
}

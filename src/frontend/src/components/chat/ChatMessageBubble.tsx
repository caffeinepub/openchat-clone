import { Link } from "@tanstack/react-router";
import { Edit2, Pin, PinOff, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGetReactions } from "../../hooks/useBackend";
import type {
  AudioContent,
  ImageContent,
  LinkContent,
  ReactionGroup,
  RoomType,
  UnifiedMessage,
  VideoContent,
} from "../../types";
import { LinkMessageBubble } from "../LinkPreviewCard";
import { MessageReactions } from "../MessageReactions";
import { ReactionPicker } from "../ReactionPicker";
import { AvatarBubble } from "../Sidebar";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(ts: bigint | number): string {
  if (!ts && ts !== 0) return "";
  let ms: number;
  if (typeof ts === "bigint") {
    if (ts <= 0n) return "";
    // IC timestamps are nanoseconds since epoch — values above ~2e16 are nanoseconds
    // A millisecond timestamp for year 2024 is ~1.7e12; nanoseconds ~1.7e21 as bigint
    // Heuristic: if the bigint value is > 1e15 (year 33658 in ms), treat as nanoseconds
    ms = ts > 1_000_000_000_000_000n ? Number(ts / 1_000_000n) : Number(ts);
  } else {
    if (ts <= 0) return "";
    ms = ts;
  }
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Inline edit ──────────────────────────────────────────────────────────────

function InlineEdit({
  initialText,
  onSave,
  onCancel,
}: {
  initialText: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialText);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSave(value.trim());
    }
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-[320px]">
      <textarea
        ref={ref}
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        data-ocid="edit-message-input"
        className="w-full resize-none rounded-xl border border-primary/40 bg-card px-3 py-2 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body scrollbar-thin"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => value.trim() && onSave(value.trim())}
          disabled={!value.trim() || value.trim() === initialText}
          data-ocid="save-edit-btn"
          className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold transition-smooth hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          data-ocid="cancel-edit-btn"
          className="px-3 py-1 rounded-lg bg-muted text-muted-foreground text-sm font-display hover:bg-muted/80 transition-colors-fast"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ChatMessageBubbleProps {
  message: UnifiedMessage;
  isOwn: boolean;
  currentUserId: string;
  roomType: RoomType;
  /** Room creator can delete others' messages (catalog) */
  isRoomCreator?: boolean;
  /** Whether to show profile link nav (group rooms) */
  showProfileLink?: boolean;
  onDelete: () => void;
  onEdit: (newText: string) => void;
  onPin: () => void;
  onUnpin: () => void;
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  /** Inline reactions from the message itself (catalog/feed) — if undefined, loads from useGetReactions (group) */
  inlineReactions?: ReactionGroup[];
}

// ─── Main bubble component ────────────────────────────────────────────────────

export function ChatMessageBubble({
  message,
  isOwn,
  currentUserId,
  roomType,
  isRoomCreator = false,
  showProfileLink = false,
  onDelete,
  onEdit,
  onPin,
  onUnpin,
  onAddReaction,
  onRemoveReaction,
  inlineReactions,
}: ChatMessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Group rooms: fetch reactions from query store. Catalog/feed: use inline data.
  const groupReactionsQuery = useGetReactions(
    roomType === "group" ? message.id : null,
  );
  const reactions: ReactionGroup[] =
    inlineReactions ?? groupReactionsQuery.data ?? [];

  const content = message.content;
  const isPinned = message.pinned;
  const isDeleted = message.deleted;
  const isTextOnly =
    !content || content.kind === "text" || content.kind === "link";

  const canDelete = isOwn || isRoomCreator;
  const canEdit = isOwn && isTextOnly && !isDeleted;
  const canPin = !isDeleted;

  const handlePickerToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPicker((v) => !v);
  };

  const handleReactionToggle = useCallback(
    (emoji: string, hasReacted: boolean) => {
      setShowPicker(false);
      if (hasReacted) {
        onRemoveReaction(emoji);
      } else {
        onAddReaction(emoji);
      }
    },
    [onAddReaction, onRemoveReaction],
  );

  const handlePickEmoji = useCallback(
    (emoji: string) => {
      setShowPicker(false);
      const existing = reactions.find((r) => r.emoji === emoji);
      const hasReacted = existing?.userIds.includes(currentUserId) ?? false;
      handleReactionToggle(emoji, hasReacted);
    },
    [reactions, currentUserId, handleReactionToggle],
  );

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  const senderName = message.senderProfile?.displayName ?? message.senderId;
  const senderInitials =
    message.senderProfile?.avatarInitials ??
    senderName.slice(0, 2).toUpperCase();

  return (
    <div
      className={`flex gap-2.5 group ${isOwn ? "flex-row-reverse" : "flex-row"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowPicker(false);
      }}
      data-ocid="chat-message-row"
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="flex-shrink-0 pt-4">
          {showProfileLink ? (
            <Link
              to="/profile/$userId"
              params={{ userId: message.senderId }}
              onClick={(e) => e.stopPropagation()}
              data-ocid={`sender-avatar-${message.senderId}`}
            >
              <AvatarBubble initials={senderInitials} size="sm" />
            </Link>
          ) : (
            <AvatarBubble initials={senderInitials} size="sm" />
          )}
        </div>
      )}

      <div
        className={`flex flex-col gap-0.5 max-w-[72%] ${isOwn ? "items-end" : "items-start"}`}
      >
        {/* Sender name */}
        {!isOwn && (
          <span className="text-[13px] font-medium text-muted-foreground font-display ml-1 select-none">
            {senderName}
          </span>
        )}

        {/* Bubble row */}
        <div
          className={`relative flex items-end gap-1.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
          ref={pickerRef}
        >
          {/* Pin badge */}
          {isPinned && !isDeleted && !editing && (
            <Pin className="w-3 h-3 text-primary/50 flex-shrink-0 mb-1" />
          )}

          {/* Content */}
          {isDeleted ? (
            <div
              className={`px-4 py-2.5 text-sm italic rounded-2xl border ${
                isOwn
                  ? "rounded-br-sm border-primary/20 bg-primary/10 text-primary/50"
                  : "rounded-bl-sm border-border bg-muted/40 text-muted-foreground/60"
              }`}
              data-ocid="deleted-message"
            >
              {roomType === "catalog"
                ? "Message removed by room creator"
                : "Message deleted"}
            </div>
          ) : editing ? (
            <InlineEdit
              initialText={message.text}
              onSave={(newText) => {
                onEdit(newText);
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              {content?.kind === "image" && (
                <a
                  href={(content.image as ImageContent).url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  data-ocid="image-message-bubble"
                >
                  <img
                    src={(content.image as ImageContent).url}
                    alt="Attachment"
                    className={`rounded-2xl border border-border/50 object-cover max-w-[260px] max-h-64 cursor-pointer hover:opacity-90 transition-smooth ${
                      isOwn ? "rounded-br-sm" : "rounded-bl-sm"
                    }`}
                  />
                </a>
              )}

              {content?.kind === "video" && (
                // biome-ignore lint/a11y/useMediaCaption: video message playback
                <video
                  controls
                  src={(content.video as VideoContent).url}
                  className={`rounded-2xl border border-border/50 max-w-[300px] ${
                    isOwn ? "rounded-br-sm" : "rounded-bl-sm"
                  }`}
                  data-ocid="video-message-bubble"
                />
              )}

              {content?.kind === "audio" && (
                <div
                  className={`px-3 py-2 rounded-2xl border ${
                    isOwn
                      ? "rounded-br-sm bg-primary/10 border-primary/20"
                      : "rounded-bl-sm bg-card border-border"
                  }`}
                  data-ocid="audio-message-bubble"
                >
                  {/* biome-ignore lint/a11y/useMediaCaption: audio message playback */}
                  <audio
                    controls
                    src={(content.audio as AudioContent).url}
                    className="h-9 max-w-[260px]"
                  />
                </div>
              )}

              {content?.kind === "link" && (
                <LinkMessageBubble
                  link={content.link as LinkContent}
                  isOwn={isOwn}
                />
              )}

              {(!content || content.kind === "text") && message.text && (
                <div
                  className={`px-4 py-2.5 text-[15px] leading-relaxed break-words ${
                    isOwn ? "message-bubble-self" : "message-bubble-other"
                  }`}
                  data-ocid="text-message-bubble"
                >
                  {content?.kind === "text" ? content.text : message.text}
                </div>
              )}
            </>
          )}

          {/* Emoji trigger */}
          {!isDeleted && !editing && showActions && (
            <button
              type="button"
              onClick={handlePickerToggle}
              aria-label="Add reaction"
              data-ocid="reaction-trigger-btn"
              className="w-6 h-6 flex items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors-fast flex-shrink-0 mb-0.5 text-sm"
            >
              😊
            </button>
          )}

          {/* Reaction picker */}
          <ReactionPicker
            visible={showPicker}
            onPick={handlePickEmoji}
            isOwn={isOwn}
          />
        </div>

        {/* Reaction pills */}
        <MessageReactions
          reactions={reactions}
          currentUserId={currentUserId}
          onToggle={handleReactionToggle}
          isOwn={isOwn}
        />

        {/* Meta row */}
        <div
          className={`flex items-center gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
        >
          <span className="text-[13px] text-muted-foreground/50 select-none">
            {formatTime(message.timestamp)}
          </span>

          {message.editedAt && (
            <span className="text-[13px] text-muted-foreground/40 select-none italic">
              edited
            </span>
          )}

          {/* Action buttons */}
          {!isDeleted && !editing && showActions && (
            <div
              className={`flex items-center gap-0.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
            >
              {canPin && (
                <button
                  type="button"
                  onClick={isPinned ? onUnpin : onPin}
                  aria-label={isPinned ? "Unpin message" : "Pin message"}
                  data-ocid="pin-message-btn"
                  className="w-5 h-5 flex items-center justify-center text-muted-foreground/40 hover:text-primary transition-colors-fast rounded"
                >
                  {isPinned ? (
                    <PinOff className="w-3 h-3" />
                  ) : (
                    <Pin className="w-3 h-3" />
                  )}
                </button>
              )}

              {canEdit && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  aria-label="Edit message"
                  data-ocid="edit-message-btn"
                  className="w-5 h-5 flex items-center justify-center text-muted-foreground/40 hover:text-primary transition-colors-fast rounded"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}

              {canDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  aria-label="Delete message"
                  data-ocid="delete-message-btn"
                  className="w-5 h-5 flex items-center justify-center text-muted-foreground/40 hover:text-destructive transition-colors-fast rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

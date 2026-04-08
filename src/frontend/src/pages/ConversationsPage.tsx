import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { MessageSquare, Plus, Users } from "lucide-react";
import { useIsMobile } from "../hooks/use-mobile";
import {
  useListConversations,
  useMarkConversationRead,
} from "../hooks/useBackend";
import type { ConversationSummary } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(ts: bigint | undefined): string {
  if (!ts) return "";
  const ms = Number(ts);
  const diff = Date.now() - ms;
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) {
    return new Date(ms).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return new Date(ms).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??"
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConversationRow({
  conv,
  onSelect,
}: {
  conv: ConversationSummary;
  onSelect: () => void;
}) {
  const initials = getInitials(conv.name);
  const hasUnread = conv.unreadCount > 0;

  return (
    <Link
      to="/conversations/$id"
      params={{ id: conv.id }}
      onClick={onSelect}
      data-ocid={`conv-row-${conv.id}`}
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors-fast border-b border-border/50 group"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-full bg-primary/20 text-primary flex items-center justify-center font-display font-semibold text-sm">
          {initials}
        </div>
        {conv.type === "group" && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-sidebar border-2 border-background flex items-center justify-center">
            <Users className="w-2.5 h-2.5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span
            className={`text-sm truncate ${hasUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}
          >
            {conv.name}
          </span>
          <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">
            {formatRelativeTime(conv.lastMessageTime)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-xs truncate ${hasUnread ? "text-foreground/70" : "text-muted-foreground"}`}
          >
            {conv.lastMessage ?? "No messages yet"}
          </span>
          {hasUnread && (
            <Badge
              data-ocid={`unread-badge-${conv.id}`}
              className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex-shrink-0"
            >
              {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

function ConversationRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50">
      <Skeleton className="w-11 h-11 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  );
}

// ─── Mobile conversation list ─────────────────────────────────────────────────

function MobileConversationList() {
  const { data: conversations, isLoading } = useListConversations();
  const markRead = useMarkConversationRead();

  const handleSelect = (conv: ConversationSummary) => {
    if (conv.unreadCount > 0) {
      markRead.mutate(conv.id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-10">
        <h1 className="font-display font-semibold text-lg text-foreground">
          Messages
        </h1>
        <div className="flex items-center gap-2">
          <Link
            to="/conversations/new/dm"
            data-ocid="mobile-new-dm-btn"
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-colors-fast"
            title="New direct message"
          >
            <Plus className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 px-4 py-3 border-b border-border bg-card/50">
        <Link
          to="/conversations/new/dm"
          data-ocid="mobile-start-dm-btn"
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm transition-smooth hover:opacity-90"
        >
          <Plus className="w-3.5 h-3.5" />
          Direct Message
        </Link>
        <Link
          to="/conversations/new/group"
          data-ocid="mobile-start-group-btn"
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-card border border-border text-foreground font-display font-semibold text-sm transition-smooth hover:bg-muted"
        >
          <Users className="w-3.5 h-3.5" />
          Group Chat
        </Link>
      </div>

      {/* List */}
      <div
        className="flex-1 overflow-y-auto scrollbar-thin"
        data-ocid="mobile-conversation-list"
      >
        {isLoading ? (
          ["a", "b", "c", "d", "e", "f"].map((k) => (
            <ConversationRowSkeleton key={`skel-${k}`} />
          ))
        ) : conversations && conversations.length > 0 ? (
          conversations.map((conv) => (
            <ConversationRow
              key={conv.id}
              conv={conv}
              onSelect={() => handleSelect(conv)}
            />
          ))
        ) : (
          <MobileEmptyState />
        )}
      </div>
    </div>
  );
}

function MobileEmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center flex-1 py-20 px-8 text-center"
      data-ocid="mobile-empty-conversations"
    >
      <div className="relative mb-5">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <MessageSquare className="w-9 h-9 text-primary/70" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
          <Users className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
      <h2 className="font-display font-semibold text-lg text-foreground mb-1">
        No conversations yet
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        Start a direct message or create a group chat to begin communicating.
      </p>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <Link
          to="/conversations/new/dm"
          data-ocid="mobile-empty-dm-cta"
          className="flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm transition-smooth hover:opacity-90 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          New Direct Message
        </Link>
        <Link
          to="/conversations/new/group"
          data-ocid="mobile-empty-group-cta"
          className="flex items-center justify-center gap-2 h-10 rounded-xl bg-card border border-border text-foreground font-display font-semibold text-sm transition-smooth hover:bg-muted active:scale-[0.98]"
        >
          <Users className="w-4 h-4" />
          New Group Chat
        </Link>
      </div>
    </div>
  );
}

// ─── Desktop welcome state ────────────────────────────────────────────────────

function DesktopWelcome() {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center bg-background"
      data-ocid="conversations-empty-state"
    >
      <div className="flex flex-col items-center gap-5 max-w-xs text-center px-6">
        {/* Decorative icon group */}
        <div className="relative mb-2">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <MessageSquare className="w-9 h-9 text-primary/70" />
          </div>
          <div className="absolute -bottom-2 -right-3 w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        <div>
          <h2 className="font-display font-semibold text-lg text-foreground">
            Your conversations
          </h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Select a conversation from the sidebar, or start a new one to begin
            messaging.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Link
            to="/conversations/new/dm"
            data-ocid="start-dm-cta"
            className="flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm transition-smooth hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            New Direct Message
          </Link>
          <Link
            to="/conversations/new/group"
            data-ocid="start-group-cta"
            className="flex items-center justify-center gap-2 h-10 rounded-xl bg-card border border-border text-foreground font-display font-semibold text-sm transition-smooth hover:bg-muted active:scale-[0.98]"
          >
            <Users className="w-4 h-4" />
            New Group Chat
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConversationsPage() {
  const isMobile = useIsMobile();

  // On mobile: show the full conversations list (sidebar is hidden)
  // On desktop: show the welcome/select state (sidebar shows the list)
  if (isMobile) {
    return <MobileConversationList />;
  }

  return <DesktopWelcome />;
}

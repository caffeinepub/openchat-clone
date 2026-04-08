import { Skeleton } from "@/components/ui/skeleton";
import {
  Link,
  useNavigate,
  useParams,
  useRouterState,
} from "@tanstack/react-router";
import {
  ChevronLeft,
  Globe,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Moon,
  Plus,
  Search,
  Sun,
  X,
} from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "../hooks/use-mobile";
import { useAuth } from "../hooks/useAuth";
import {
  useGetJoinedCatalogRooms,
  useGetUnreadCatalogCount,
  useGetUnreadFeedCount,
  useListConversations,
  useMarkConversationRead,
  useSearchMessages,
} from "../hooks/useBackend";
import { useTheme } from "../hooks/useTheme";
import type { CatalogRoom, ConversationSummary } from "../types";
import EditProfileModal from "./EditProfileModal";

function formatTime(ts: bigint | undefined): string {
  if (!ts || ts <= 0n) return "";
  // IC timestamps are nanoseconds; heuristic: > 1e15 means nanoseconds
  const ms = ts > 1_000_000_000_000_000n ? Number(ts / 1_000_000n) : Number(ts);
  if (Number.isNaN(ms) || ms <= 0) return "";
  const now = Date.now();
  const diff = now - ms;
  if (diff < 1000 * 60 * 60) {
    const m = Math.floor(diff / 60000);
    return m <= 0 ? "now" : `${m}m`;
  }
  if (diff < 1000 * 60 * 60 * 24) {
    const d = new Date(ms);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const d = new Date(ms);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function AvatarBubble({
  initials,
  size = "md",
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
}) {
  const s =
    size === "sm"
      ? "w-8 h-8 text-xs"
      : size === "lg"
        ? "w-12 h-12 text-base"
        : "w-10 h-10 text-sm";
  return (
    <div
      className={`${s} rounded-full bg-primary/20 text-primary flex items-center justify-center font-display font-semibold flex-shrink-0`}
    >
      {initials.slice(0, 2)}
    </div>
  );
}

function ConversationItem({
  conv,
  isActive,
  onSelect,
}: {
  conv: ConversationSummary;
  isActive: boolean;
  onSelect: () => void;
}) {
  const initials =
    conv.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??";

  return (
    <Link
      to="/conversations/$id"
      params={{ id: conv.id }}
      onClick={onSelect}
      data-ocid={`conv-item-${conv.id}`}
      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors-fast rounded-lg mx-1 ${
        isActive ? "conversation-item-active" : "conversation-item-inactive"
      }`}
    >
      <AvatarBubble initials={initials} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="font-display font-medium text-[15px] text-sidebar-foreground truncate">
            {conv.name}
          </span>
          <span className="text-[13px] text-muted-foreground flex-shrink-0">
            {formatTime(conv.lastMessageTime)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <span className="text-[13px] text-muted-foreground truncate">
            {conv.lastMessage ?? "No messages yet"}
          </span>
          {conv.unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">
              {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

function CatalogRoomItem({
  room,
  isActive,
  onSelect,
}: {
  room: CatalogRoom;
  isActive: boolean;
  onSelect: () => void;
}) {
  const { data: unread = 0 } = useGetUnreadCatalogCount(room.id);
  const initials =
    room.title
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "##";
  return (
    <Link
      to="/catalog/$roomId"
      params={{ roomId: room.id }}
      onClick={onSelect}
      data-ocid={`catalog-room-item-${room.id}`}
      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors-fast rounded-lg mx-1 ${
        isActive ? "conversation-item-active" : "conversation-item-inactive"
      }`}
    >
      <AvatarBubble initials={initials} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="font-display font-medium text-[15px] text-sidebar-foreground truncate">
            {room.title}
          </span>
          {unread > 0 && !isActive && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </div>
        <span className="text-[13px] text-muted-foreground truncate block">
          {room.messageCount} messages
        </span>
      </div>
    </Link>
  );
}

// ─── Search panel ─────────────────────────────────────────────────────────────

function SearchPanel({
  onClose,
  onNavigate,
}: {
  onClose: () => void;
  onNavigate: (convId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const { data: results = [], isFetching } = useSearchMessages(query);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Search input */}
      <div className="px-3 py-2 border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sidebar-accent border border-sidebar-border">
          <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <input
            // biome-ignore lint/a11y/noAutofocus: intentional focus for search UX
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages…"
            data-ocid="search-input"
            className="flex-1 bg-transparent text-base text-sidebar-foreground placeholder:text-muted-foreground/60 outline-none font-body"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors-fast"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
        {query.length > 0 && query.length < 3 && (
          <p className="px-4 py-6 text-[13px] text-muted-foreground text-center">
            Type at least 3 characters to search
          </p>
        )}

        {query.length >= 3 && isFetching && (
          <div className="space-y-1 px-2 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2 px-2 py-2 rounded-lg">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        )}

        {query.length >= 3 && !isFetching && results.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-10 px-4 text-center"
            data-ocid="search-empty"
          >
            <Search className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-[13px] text-muted-foreground">
              No results found
            </p>
            <p className="text-[13px] text-muted-foreground/60 mt-1">
              Try different keywords
            </p>
          </div>
        )}

        {results.map((result) => {
          const initials =
            result.senderProfile?.avatarInitials ??
            result.sender.slice(0, 2).toUpperCase();
          const senderName = result.senderProfile?.displayName ?? result.sender;
          return (
            <button
              key={`${result.conversationId}-${result.messageId}`}
              type="button"
              data-ocid={`search-result-${result.messageId}`}
              onClick={() => {
                onNavigate(result.conversationId);
                onClose();
              }}
              className="w-full flex items-start gap-3 px-3 py-2.5 mx-1 rounded-lg text-left hover:bg-sidebar-accent transition-colors-fast"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-display text-xs font-semibold flex-shrink-0 mt-0.5">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-display font-semibold text-[13px] text-sidebar-foreground truncate">
                    {result.conversationName}
                  </span>
                  <span className="text-[13px] text-muted-foreground/60 flex-shrink-0">
                    {formatTime(result.sentAt)}
                  </span>
                </div>
                <p className="text-[13px] text-muted-foreground/70 mb-0.5 truncate">
                  {senderName}
                </p>
                <p className="text-[13px] text-muted-foreground line-clamp-2 break-words">
                  {result.snippet}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Close search */}
      <div className="px-3 py-2 border-t border-sidebar-border">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 w-full h-8 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent text-[13px] transition-colors-fast"
          data-ocid="close-search-btn"
        >
          <X className="w-3.5 h-3.5" />
          Close search
        </button>
      </div>
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { currentUser, logout } = useAuth();
  const { data: conversations, isLoading } = useListConversations();
  const { data: feedUnread = 0 } = useGetUnreadFeedCount();
  const { data: joinedCatalogRooms = [] } = useGetJoinedCatalogRooms();
  const markRead = useMarkConversationRead();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const params = useParams({ strict: false }) as { id?: string };
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const activeId = params.id;
  const isFeedActive = currentPath.startsWith("/feed");
  const isCatalogActive = currentPath.startsWith("/catalog");
  const isConversationsActive = !isFeedActive && !isCatalogActive;
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSelect = (conv: ConversationSummary) => {
    if (conv.unreadCount > 0) {
      markRead.mutate(conv.id);
    }
    if (isMobile) setCollapsed(true);
  };

  if (collapsed && isMobile) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
          aria-label="Open sidebar"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <aside className="flex h-full bg-sidebar border-r border-sidebar-border">
        {/* Icon rail */}
        <div className="w-14 flex flex-col items-center py-3 gap-2 border-r border-sidebar-border">
          {/* App icon */}
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 32 32"
              fill="none"
              role="img"
              aria-label="OpenChat"
            >
              <path
                d="M6 8C6 6.9 6.9 6 8 6h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H10l-4 4V8z"
                fill="oklch(0.65 0.26 193)"
              />
            </svg>
          </div>

          <button
            type="button"
            aria-label="Conversations"
            data-ocid="nav-conversations"
            onClick={() => {
              setSearchOpen(false);
              navigate({ to: "/conversations" });
            }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors-fast ${
              isConversationsActive ? "nav-icon-active" : "nav-icon-inactive"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            type="button"
            aria-label="Search messages"
            data-ocid="nav-search"
            onClick={() => setSearchOpen((v) => !v)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors-fast ${
              searchOpen ? "nav-icon-active" : "nav-icon-inactive"
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            aria-label="Catalog"
            data-ocid="nav-catalog"
            onClick={() => {
              setSearchOpen(false);
              navigate({ to: "/catalog" });
            }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors-fast ${
              isCatalogActive ? "nav-icon-active" : "nav-icon-inactive"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          <div className="flex-1" />

          {currentUser && (
            <button
              type="button"
              className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary transition-all duration-150 flex-shrink-0"
              title={`${currentUser.displayName} — Edit profile`}
              data-ocid="current-user-avatar"
              onClick={() => setEditProfileOpen(true)}
            >
              {currentUser.profileImageUrl ? (
                <img
                  src={currentUser.profileImageUrl}
                  alt={currentUser.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-primary/20 text-primary flex items-center justify-center font-display text-xs font-bold">
                  {currentUser.avatarInitials}
                </div>
              )}
            </button>
          )}

          <button
            type="button"
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            data-ocid="nav-theme-toggle"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors-fast nav-icon-inactive"
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            aria-label="Sign out"
            data-ocid="nav-logout"
            onClick={logout}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors-fast text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation list panel */}
        <div className="w-64 flex flex-col overflow-hidden">
          {searchOpen ? (
            <SearchPanel
              onClose={() => setSearchOpen(false)}
              onNavigate={(convId) => {
                navigate({ to: "/conversations/$id", params: { id: convId } });
                if (isMobile) setCollapsed(true);
              }}
            />
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border flex-shrink-0">
                <h2 className="font-display font-semibold text-sm text-sidebar-foreground">
                  Conversations
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Search messages"
                    data-ocid="search-toggle-btn"
                    onClick={() => setSearchOpen(true)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors-fast nav-icon-inactive"
                    title="Search messages"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                  <Link
                    to="/conversations/new/dm"
                    data-ocid="new-dm-btn"
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors-fast nav-icon-inactive"
                    title="New direct message"
                  >
                    <Plus className="w-4 h-4" />
                  </Link>
                  {isMobile && (
                    <button
                      type="button"
                      aria-label="Collapse sidebar"
                      onClick={() => setCollapsed(true)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors-fast nav-icon-inactive"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* New group button */}
              <div className="px-3 py-2 flex-shrink-0">
                <Link
                  to="/conversations/new/group"
                  data-ocid="new-group-btn"
                  className="flex items-center gap-2 w-full h-9 px-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm transition-smooth hover:opacity-90 justify-center"
                >
                  <Plus className="w-4 h-4" />
                  New Message
                </Link>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
                {/* Feed pinned item */}
                <Link
                  to="/feed"
                  data-ocid="nav-feed-item"
                  onClick={() => {
                    if (isMobile) setCollapsed(true);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors-fast rounded-lg mx-1 mb-1 ${
                    isFeedActive
                      ? "conversation-item-active"
                      : "conversation-item-inactive"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isFeedActive
                        ? "bg-primary-foreground/20"
                        : "bg-primary/20"
                    }`}
                  >
                    <Globe
                      className={`w-5 h-5 ${isFeedActive ? "text-primary-foreground" : "text-primary"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-display font-medium text-[15px] text-sidebar-foreground truncate">
                        Feed
                      </span>
                      {feedUnread > 0 && !isFeedActive && (
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {feedUnread > 9 ? "9+" : feedUnread}
                        </span>
                      )}
                    </div>
                    <span className="text-[13px] text-muted-foreground truncate">
                      Public community posts
                    </span>
                  </div>
                </Link>

                {/* Catalog pinned item */}
                <Link
                  to="/catalog"
                  data-ocid="nav-catalog-item"
                  onClick={() => {
                    if (isMobile) setCollapsed(true);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors-fast rounded-lg mx-1 mb-1 ${
                    isCatalogActive
                      ? "conversation-item-active"
                      : "conversation-item-inactive"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCatalogActive
                        ? "bg-primary-foreground/20"
                        : "bg-primary/20"
                    }`}
                  >
                    <LayoutGrid
                      className={`w-5 h-5 ${isCatalogActive ? "text-primary-foreground" : "text-primary"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-display font-medium text-[15px] text-sidebar-foreground truncate">
                        Catalog
                      </span>
                    </div>
                    <span className="text-[13px] text-muted-foreground truncate">
                      Browse & create rooms
                    </span>
                  </div>
                </Link>

                {/* Joined catalog rooms */}
                {joinedCatalogRooms.length > 0 && (
                  <>
                    <div className="mx-4 mb-1 border-t border-sidebar-border/50" />
                    <p className="px-4 py-1 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      Your Rooms
                    </p>
                    {joinedCatalogRooms.map((room) => (
                      <CatalogRoomItem
                        key={room.id}
                        room={room}
                        isActive={currentPath === `/catalog/${room.id}`}
                        onSelect={() => {
                          if (isMobile) setCollapsed(true);
                        }}
                      />
                    ))}
                  </>
                )}

                {/* Divider */}
                <div className="mx-4 mb-1 border-t border-sidebar-border/50" />

                {isLoading ? (
                  <>
                    <ConversationSkeleton key="skel-a" />
                    <ConversationSkeleton key="skel-b" />
                    <ConversationSkeleton key="skel-c" />
                    <ConversationSkeleton key="skel-d" />
                    <ConversationSkeleton key="skel-e" />
                  </>
                ) : conversations && conversations.length > 0 ? (
                  conversations.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      isActive={conv.id === activeId}
                      onSelect={() => handleSelect(conv)}
                    />
                  ))
                ) : (
                  <div
                    className="flex flex-col items-center justify-center py-12 px-4 text-center"
                    data-ocid="empty-conversations"
                  >
                    <MessageSquare className="w-10 h-10 text-muted-foreground/40 mb-3" />
                    <p className="text-[13px] font-display">
                      No conversations yet
                    </p>
                    <p className="text-[13px] text-muted-foreground/60 mt-1">
                      Start a new message to get going
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </aside>

      {editProfileOpen && (
        <EditProfileModal onClose={() => setEditProfileOpen(false)} />
      )}
    </>
  );
}

export { AvatarBubble };

import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Heart, MessageCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { AvatarBubble } from "../components/Sidebar";
import { ChatComposeBar } from "../components/chat/ChatComposeBar";
import { ChatMessageBubble } from "../components/chat/ChatMessageBubble";
import { useChatRoom } from "../components/chat/useChatRoom";
import { useAuth } from "../hooks/useAuth";
import {
  useGetFeedPosts,
  useLikePost,
  useUnlikePost,
} from "../hooks/useBackend";
import { useUploadFile } from "../hooks/useUploadFile";
import type { FeedPost } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(ts: bigint): string {
  if (!ts || ts <= 0n) return "";
  // IC timestamps are nanoseconds; heuristic: > 1e15 means nanoseconds
  const ms = ts > 1_000_000_000_000_000n ? Number(ts / 1_000_000n) : Number(ts);
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// ─── Pinned post card ──────────────────────────────────────────────────────────

function PinnedPostCard({ post }: { post: FeedPost }) {
  const likePost = useLikePost();
  const unlikePost = useUnlikePost();

  const toggleLike = () => {
    if (post.likedByMe) {
      unlikePost.mutate({ postId: post.id });
    } else {
      likePost.mutate({ postId: post.id });
    }
  };

  const initials = post.author.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Resolve media from content variant first, fall back to legacy mediaUrl
  const imageUrl =
    post.content?.kind === "image"
      ? post.content.image.url
      : post.mediaKind === "image"
        ? post.mediaUrl
        : undefined;

  const videoUrl =
    post.content?.kind === "video"
      ? post.content.video.url
      : post.mediaKind === "video"
        ? post.mediaUrl
        : undefined;

  return (
    <div
      className="flex-shrink-0 bg-card border-b border-border px-4 py-4"
      data-ocid="pinned-post-card"
    >
      <div className="flex gap-3">
        <AvatarBubble initials={initials} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-display font-semibold text-sm text-foreground">
              {post.author.displayName}
            </span>
            <span className="text-[13px] text-muted-foreground flex-shrink-0">
              {relativeTime(post.timestamp)}
            </span>
          </div>

          <p className="text-sm text-foreground/90 mt-1.5 leading-relaxed break-words">
            {post.text}
          </p>

          {imageUrl && (
            <div className="mt-3 rounded-lg overflow-hidden border border-border/50 bg-muted/30">
              <img
                src={imageUrl}
                alt="Post attachment"
                className="w-full max-h-52 object-cover"
                loading="lazy"
              />
            </div>
          )}

          {videoUrl && (
            <div className="mt-3 rounded-lg overflow-hidden border border-border/50 bg-muted/30">
              {/* biome-ignore lint/a11y/useMediaCaption: user-generated content */}
              <video
                src={videoUrl}
                controls
                className="w-full max-h-48"
                preload="metadata"
              />
            </div>
          )}

          {/* Like + reply count */}
          <div className="flex items-center gap-5 mt-3">
            <button
              type="button"
              onClick={toggleLike}
              data-ocid={`like-post-${post.id}`}
              aria-label={post.likedByMe ? "Unlike post" : "Like post"}
              className={`flex items-center gap-1.5 text-sm transition-colors duration-150 ${
                post.likedByMe
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${post.likedByMe ? "fill-primary" : ""}`}
              />
              <span>{post.likeCount}</span>
            </button>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageCircle className="w-4 h-4" />
              <span>{post.replyCount}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeletons ─────────────────────────────────────────────────────────────────

function ReplySkeletons() {
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

function EmptyReplies() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full text-center px-8"
      data-ocid="empty-replies"
    >
      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
        <MessageCircle className="w-6 h-6 text-primary/50" />
      </div>
      <p className="font-display font-semibold text-foreground text-sm">
        No replies yet
      </p>
      <p className="text-[13px] text-muted-foreground mt-1.5">
        Be the first to join this conversation
      </p>
    </div>
  );
}

// ─── Post room page ────────────────────────────────────────────────────────────

export default function PostRoomPage() {
  const { postId: postIdParam } = useParams({ from: "/feed/$postId" });
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { upload } = useUploadFile();

  const postId = BigInt(postIdParam);
  const postIdStr = postIdParam;

  const { data: posts = [] } = useGetFeedPosts();
  const post = posts.find((p) => p.id === postId);

  const {
    messages,
    isLoading,
    typingUsers,
    sendText,
    sendMedia,
    sendVoice,
    sendVideo,
    sendLink,
    setTyping,
    addReaction,
    removeReaction,
    editMessage,
    deleteMessage,
    pinMessage,
    unpinMessage,
    refetch,
  } = useChatRoom({
    roomType: "feed",
    roomId: postIdStr,
    currentUserId: currentUser?.id ?? "me",
    currentUserProfile: currentUser ?? {
      id: "me",
      displayName: "You",
      avatarInitials: "YO",
    },
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Scroll to bottom when new messages arrive
  if (prevCountRef.current !== messages.length) {
    prevCountRef.current = messages.length;
    Promise.resolve().then(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Poll for new replies
  useEffect(() => {
    const timer = setInterval(() => refetch(), 3000);
    return () => clearInterval(timer);
  }, [refetch]);

  const currentUserId = currentUser?.id ?? "me";

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden"
      data-ocid="post-room-page"
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0"
        data-ocid="post-room-header"
      >
        <button
          type="button"
          onClick={() => navigate({ to: "/feed" })}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast flex-shrink-0"
          aria-label="Back to Feed"
          data-ocid="back-to-feed-btn"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="font-display font-semibold text-sm text-foreground truncate">
            {post ? post.author.displayName : "Post"}
          </h1>
          <p className="text-[13px] text-muted-foreground">Public chatroom</p>
        </div>
      </div>

      {/* ── Pinned post card ── */}
      {post ? (
        <PinnedPostCard post={post} />
      ) : (
        <div className="flex-shrink-0 bg-card border-b border-border px-4 py-4">
          <div className="flex gap-3">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        </div>
      )}

      {/* ── Replies ── */}
      <div
        className="flex-1 overflow-y-auto scrollbar-thin bg-background"
        data-ocid="replies-list"
      >
        {isLoading ? (
          <ReplySkeletons />
        ) : messages.length === 0 ? (
          <EmptyReplies />
        ) : (
          <div className="px-4 py-4 space-y-3">
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === currentUserId || msg.senderId === "me"}
                currentUserId={currentUserId}
                roomType="feed"
                inlineReactions={msg.reactions ?? []}
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

      {/* ── Compose bar ── */}
      <ChatComposeBar
        placeholder="Reply to this post…"
        typingUsers={typingUsers}
        uploadFile={upload}
        onSendText={sendText}
        onSendMedia={(file, caption) => sendMedia(file, caption)}
        onSendVoice={sendVoice}
        onSendVideo={sendVideo}
        onSendLink={sendLink}
        onTypingChange={setTyping}
      />
    </div>
  );
}

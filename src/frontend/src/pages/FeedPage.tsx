import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  Globe,
  Heart,
  ImagePlus,
  Loader2,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  useCreatePost,
  useGetFeedPosts,
  useLikePost,
  useMarkFeedRead,
  useUnlikePost,
} from "../hooks/useBackend";
import { useUploadFile } from "../hooks/useUploadFile";
import type { FeedPost, MessageContentType } from "../types";

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

function Avatar({
  initials,
  size = "md",
}: {
  initials: string;
  size?: "sm" | "md";
}) {
  const s = size === "sm" ? "w-8 h-8 text-[10px]" : "w-10 h-10 text-xs";
  return (
    <div
      className={`${s} rounded-full bg-primary/20 text-primary flex items-center justify-center font-display font-semibold flex-shrink-0`}
    >
      {initials.slice(0, 2)}
    </div>
  );
}

// ─── Resolve media from post (content variant first, legacy fallback) ─────────

function resolvePostMedia(post: FeedPost): {
  imageUrl?: string;
  videoUrl?: string;
} {
  if (post.content?.kind === "image") {
    return { imageUrl: post.content.image.url };
  }
  if (post.content?.kind === "video") {
    return { videoUrl: post.content.video.url };
  }
  if (post.mediaKind === "image" && post.mediaUrl) {
    return { imageUrl: post.mediaUrl };
  }
  if (post.mediaKind === "video" && post.mediaUrl) {
    return { videoUrl: post.mediaUrl };
  }
  return {};
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: FeedPost }) {
  const navigate = useNavigate();
  const likePost = useLikePost();
  const unlikePost = useUnlikePost();

  const { imageUrl, videoUrl } = resolvePostMedia(post);

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.likedByMe) {
      unlikePost.mutate({ postId: post.id });
    } else {
      likePost.mutate({ postId: post.id });
    }
  };

  const openChatroom = () => {
    navigate({ to: "/feed/$postId", params: { postId: post.id.toString() } });
  };

  return (
    <div
      className="bg-card border border-border rounded-xl p-4 transition-colors duration-150 hover:border-primary/30"
      data-ocid={`feed-post-${post.id}`}
    >
      {/* Post header */}
      <div className="flex gap-3">
        <Avatar initials={post.author.avatarInitials} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-display font-semibold text-sm text-foreground">
              {post.author.displayName}
            </span>
            <span className="text-[13px] text-muted-foreground flex-shrink-0">
              {relativeTime(post.timestamp)}
            </span>
          </div>

          {/* Post text — clicking navigates to chatroom */}
          <button
            type="button"
            onClick={openChatroom}
            className="text-left w-full mt-1.5"
          >
            <p className="text-sm text-foreground/90 leading-relaxed break-words hover:text-foreground transition-colors duration-150">
              {post.text}
            </p>
          </button>

          {/* Media preview — image */}
          {imageUrl && (
            <div className="mt-3 rounded-lg overflow-hidden border border-border/50 bg-muted/30">
              <img
                src={imageUrl}
                alt="Post attachment"
                className="w-full max-h-72 object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Media preview — video */}
          {videoUrl && (
            <div className="mt-3 rounded-lg overflow-hidden border border-border/50 bg-muted/30">
              {/* biome-ignore lint/a11y/useMediaCaption: user-generated content */}
              <video
                src={videoUrl}
                controls
                className="w-full max-h-64"
                preload="metadata"
              />
            </div>
          )}

          {/* Action bar */}
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

            <button
              type="button"
              onClick={openChatroom}
              data-ocid={`replies-post-${post.id}`}
              aria-label="View conversation"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors duration-150"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{post.replyCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Compose box ──────────────────────────────────────────────────────────────

const MAX_CHARS = 280;

function ComposeBox() {
  const { currentUser } = useAuth();
  const createPost = useCreatePost();
  const { upload } = useUploadFile();
  const [text, setText] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaKind, setMediaKind] = useState<"image" | "video" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remaining = MAX_CHARS - text.length;
  const canPost =
    text.trim().length > 0 &&
    remaining >= 0 &&
    !isUploading &&
    !createPost.isPending;

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const kind = file.type.startsWith("video/") ? "video" : "image";
    setMediaFile(file);
    setMediaKind(kind);
    setMediaPreview(URL.createObjectURL(file));
    setUploadError(null);
    e.target.value = "";
  };

  const removeMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview(null);
    setMediaKind(null);
    setUploadProgress(0);
    setUploadError(null);
  };

  const handlePost = async () => {
    if (!canPost || !currentUser) return;
    setUploadError(null);

    let content: MessageContentType | undefined;

    // Upload media to object storage — fail hard if upload fails, never use blob URLs
    if (mediaFile && mediaKind) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const uploadedUrl = await upload(mediaFile, (p) =>
          setUploadProgress(p),
        );
        if (!uploadedUrl.startsWith("https://")) {
          throw new Error(
            "Upload returned a temporary URL — storage upload failed.",
          );
        }
        if (mediaKind === "image") {
          content = {
            kind: "image",
            image: {
              url: uploadedUrl,
              mimeType: mediaFile.type,
              fileSize: mediaFile.size,
            },
          };
        } else {
          content = {
            kind: "video",
            video: {
              url: uploadedUrl,
              mimeType: mediaFile.type,
              fileSize: mediaFile.size,
            },
          };
        }
      } catch (err) {
        console.error("[FeedPage] Media upload error:", err);
        setIsUploading(false);
        setUploadError(
          err instanceof Error
            ? err.message
            : "Failed to upload — please try again.",
        );
        // Do NOT post — user must fix the upload first
        return;
      } finally {
        setIsUploading(false);
      }
    }

    createPost.mutate({
      text: text.trim(),
      content,
      currentUserProfile: currentUser,
    });
    setText("");
    removeMedia();
  };

  if (!currentUser) return null;

  return (
    <div
      className="bg-card border-b border-border px-4 py-3 flex-shrink-0"
      data-ocid="feed-compose"
    >
      {uploadError && (
        <div className="mb-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
          <span className="flex-1">{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            aria-label="Dismiss"
            className="text-destructive/70 hover:text-destructive"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <div className="flex gap-3">
        <Avatar initials={currentUser.avatarInitials} />
        <div className="flex-1 min-w-0">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handlePost();
            }}
            placeholder="What's on your mind?"
            data-ocid="feed-compose-input"
            maxLength={MAX_CHARS + 20}
            rows={2}
            className="w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground/50 outline-none font-body resize-none leading-relaxed"
          />

          {/* Media preview */}
          {mediaPreview && (
            <div className="relative mt-2 rounded-xl overflow-hidden border border-border/50 bg-muted/20 inline-block max-w-[200px]">
              {mediaKind === "image" ? (
                <img
                  src={mediaPreview}
                  alt="Attachment preview"
                  className="max-h-40 w-auto object-cover"
                />
              ) : (
                /* biome-ignore lint/a11y/useMediaCaption: user-generated preview */
                <video
                  src={mediaPreview}
                  className="max-h-40 w-auto"
                  preload="metadata"
                />
              )}
              {isUploading ? (
                <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-1">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span className="text-[10px] font-mono text-foreground">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={removeMedia}
                  aria-label="Remove attachment"
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 flex items-center justify-center text-foreground hover:bg-background transition-colors duration-150"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaSelect}
                className="hidden"
                aria-label="Attach image or video"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach image or video"
                data-ocid="feed-attach-btn"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-150"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs tabular-nums ${
                  remaining < 20
                    ? remaining < 0
                      ? "text-destructive font-semibold"
                      : "text-warning font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {remaining}
              </span>
              <button
                type="button"
                onClick={handlePost}
                disabled={!canPost || createPost.isPending || isUploading}
                data-ocid="feed-post-btn"
                className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-display font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity duration-150"
              >
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {isUploading ? "Uploading…" : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Feed page ────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const { data: posts = [], isLoading } = useGetFeedPosts();
  const { mutate: markRead } = useMarkFeedRead();

  useEffect(() => {
    markRead();
  }, [markRead]);

  return (
    <div className="flex flex-col h-full bg-background" data-ocid="feed-page">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-card border-b border-border flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
          <Globe className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="font-display font-semibold text-base text-foreground leading-tight">
            Feed
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Public posts from the community
          </p>
        </div>
      </div>

      {/* Compose */}
      <ComposeBox />

      {/* Posts list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl p-4 space-y-3"
                >
                  <div className="flex gap-3">
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id.toString()} post={post} />
            ))
          ) : (
            <div
              className="flex flex-col items-center justify-center py-20 text-center"
              data-ocid="feed-empty"
            >
              <Globe className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-display font-semibold text-base text-foreground">
                Nothing here yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Be the first to post something to the community
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

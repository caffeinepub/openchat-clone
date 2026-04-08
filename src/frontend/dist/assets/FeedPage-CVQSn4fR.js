import { m as useGetFeedPosts, n as useMarkFeedRead, r as reactExports, j as jsxRuntimeExports, G as Globe, S as Skeleton, a as useAuth, o as useCreatePost, f as useUploadFile, X, L as LoaderCircle, b as useNavigate, p as useLikePost, q as useUnlikePost } from "./index-D0uCIxat.js";
import { I as ImagePlus } from "./image-plus-BF3q79UM.js";
import { S as Send } from "./send-D63eB6aJ.js";
import { H as Heart, M as MessageCircle } from "./message-circle-BCJDkO6u.js";
function relativeTime(ts) {
  if (!ts || ts <= 0n) return "";
  const ms = ts > 1000000000000000n ? Number(ts / 1000000n) : Number(ts);
  const diff = Date.now() - ms;
  if (diff < 6e4) return "just now";
  if (diff < 36e5) return `${Math.floor(diff / 6e4)}m ago`;
  if (diff < 864e5) return `${Math.floor(diff / 36e5)}h ago`;
  return `${Math.floor(diff / 864e5)}d ago`;
}
function Avatar({
  initials,
  size = "md"
}) {
  const s = size === "sm" ? "w-8 h-8 text-[10px]" : "w-10 h-10 text-xs";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: `${s} rounded-full bg-primary/20 text-primary flex items-center justify-center font-display font-semibold flex-shrink-0`,
      children: initials.slice(0, 2)
    }
  );
}
function resolvePostMedia(post) {
  var _a, _b;
  if (((_a = post.content) == null ? void 0 : _a.kind) === "image") {
    return { imageUrl: post.content.image.url };
  }
  if (((_b = post.content) == null ? void 0 : _b.kind) === "video") {
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
function PostCard({ post }) {
  const navigate = useNavigate();
  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  const { imageUrl, videoUrl } = resolvePostMedia(post);
  const toggleLike = (e) => {
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
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "bg-card border border-border rounded-xl p-4 transition-colors duration-150 hover:border-primary/30",
      "data-ocid": `feed-post-${post.id}`,
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { initials: post.author.avatarInitials }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display font-semibold text-sm text-foreground", children: post.author.displayName }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[13px] text-muted-foreground flex-shrink-0", children: relativeTime(post.timestamp) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: openChatroom,
              className: "text-left w-full mt-1.5",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground/90 leading-relaxed break-words hover:text-foreground transition-colors duration-150", children: post.text })
            }
          ),
          imageUrl && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 rounded-lg overflow-hidden border border-border/50 bg-muted/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: imageUrl,
              alt: "Post attachment",
              className: "w-full max-h-72 object-cover",
              loading: "lazy"
            }
          ) }),
          videoUrl && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 rounded-lg overflow-hidden border border-border/50 bg-muted/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "video",
            {
              src: videoUrl,
              controls: true,
              className: "w-full max-h-64",
              preload: "metadata"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-5 mt-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: toggleLike,
                "data-ocid": `like-post-${post.id}`,
                "aria-label": post.likedByMe ? "Unlike post" : "Like post",
                className: `flex items-center gap-1.5 text-sm transition-colors duration-150 ${post.likedByMe ? "text-primary" : "text-muted-foreground hover:text-primary"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Heart,
                    {
                      className: `w-4 h-4 ${post.likedByMe ? "fill-primary" : ""}`
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: post.likeCount })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: openChatroom,
                "data-ocid": `replies-post-${post.id}`,
                "aria-label": "View conversation",
                className: "flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors duration-150",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "w-4 h-4" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: post.replyCount })
                ]
              }
            )
          ] })
        ] })
      ] })
    }
  );
}
const MAX_CHARS = 280;
function ComposeBox() {
  const { currentUser } = useAuth();
  const createPost = useCreatePost();
  const { upload } = useUploadFile();
  const [text, setText] = reactExports.useState("");
  const [mediaFile, setMediaFile] = reactExports.useState(null);
  const [mediaPreview, setMediaPreview] = reactExports.useState(null);
  const [mediaKind, setMediaKind] = reactExports.useState(null);
  const [isUploading, setIsUploading] = reactExports.useState(false);
  const [uploadProgress, setUploadProgress] = reactExports.useState(0);
  const [uploadError, setUploadError] = reactExports.useState(null);
  const fileInputRef = reactExports.useRef(null);
  const remaining = MAX_CHARS - text.length;
  const canPost = text.trim().length > 0 && remaining >= 0 && !isUploading && !createPost.isPending;
  const handleMediaSelect = (e) => {
    var _a;
    const file = (_a = e.target.files) == null ? void 0 : _a[0];
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
    let content;
    if (mediaFile && mediaKind) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const uploadedUrl = await upload(
          mediaFile,
          (p) => setUploadProgress(p)
        );
        if (!uploadedUrl.startsWith("https://")) {
          throw new Error(
            "Upload returned a temporary URL — storage upload failed."
          );
        }
        if (mediaKind === "image") {
          content = {
            kind: "image",
            image: {
              url: uploadedUrl,
              mimeType: mediaFile.type,
              fileSize: mediaFile.size
            }
          };
        } else {
          content = {
            kind: "video",
            video: {
              url: uploadedUrl,
              mimeType: mediaFile.type,
              fileSize: mediaFile.size
            }
          };
        }
      } catch (err) {
        console.error("[FeedPage] Media upload error:", err);
        setIsUploading(false);
        setUploadError(
          err instanceof Error ? err.message : "Failed to upload — please try again."
        );
        return;
      } finally {
        setIsUploading(false);
      }
    }
    createPost.mutate({
      text: text.trim(),
      content,
      currentUserProfile: currentUser
    });
    setText("");
    removeMedia();
  };
  if (!currentUser) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "bg-card border-b border-border px-4 py-3 flex-shrink-0",
      "data-ocid": "feed-compose",
      children: [
        uploadError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1", children: uploadError }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => setUploadError(null),
              "aria-label": "Dismiss",
              className: "text-destructive/70 hover:text-destructive",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3 h-3" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { initials: currentUser.avatarInitials }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                value: text,
                onChange: (e) => setText(e.target.value),
                onKeyDown: (e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handlePost();
                },
                placeholder: "What's on your mind?",
                "data-ocid": "feed-compose-input",
                maxLength: MAX_CHARS + 20,
                rows: 2,
                className: "w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground/50 outline-none font-body resize-none leading-relaxed"
              }
            ),
            mediaPreview && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-2 rounded-xl overflow-hidden border border-border/50 bg-muted/20 inline-block max-w-[200px]", children: [
              mediaKind === "image" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: mediaPreview,
                  alt: "Attachment preview",
                  className: "max-h-40 w-auto object-cover"
                }
              ) : (
                /* biome-ignore lint/a11y/useMediaCaption: user-generated preview */
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "video",
                  {
                    src: mediaPreview,
                    className: "max-h-40 w-auto",
                    preload: "metadata"
                  }
                )
              ),
              isUploading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-5 h-5 text-primary animate-spin" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-mono text-foreground", children: [
                  Math.round(uploadProgress),
                  "%"
                ] })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: removeMedia,
                  "aria-label": "Remove attachment",
                  className: "absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 flex items-center justify-center text-foreground hover:bg-background transition-colors duration-150",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3 h-3" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    ref: fileInputRef,
                    type: "file",
                    accept: "image/*,video/*",
                    onChange: handleMediaSelect,
                    className: "hidden",
                    "aria-label": "Attach image or video"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      var _a;
                      return (_a = fileInputRef.current) == null ? void 0 : _a.click();
                    },
                    "aria-label": "Attach image or video",
                    "data-ocid": "feed-attach-btn",
                    className: "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-150",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ImagePlus, { className: "w-4 h-4" })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: `text-xs tabular-nums ${remaining < 20 ? remaining < 0 ? "text-destructive font-semibold" : "text-warning font-medium" : "text-muted-foreground"}`,
                    children: remaining
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: handlePost,
                    disabled: !canPost || createPost.isPending || isUploading,
                    "data-ocid": "feed-post-btn",
                    className: "flex items-center gap-1.5 h-8 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-display font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity duration-150",
                    children: [
                      isUploading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "w-3.5 h-3.5" }),
                      isUploading ? "Uploading…" : "Post"
                    ]
                  }
                )
              ] })
            ] })
          ] })
        ] })
      ]
    }
  );
}
function FeedPage() {
  const { data: posts = [], isLoading } = useGetFeedPosts();
  const { mutate: markRead } = useMarkFeedRead();
  reactExports.useEffect(() => {
    markRead();
  }, [markRead]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full bg-background", "data-ocid": "feed-page", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-5 py-4 bg-card border-b border-border flex-shrink-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "w-4 h-4 text-primary" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-semibold text-base text-foreground leading-tight", children: "Feed" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-muted-foreground", children: "Public posts from the community" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ComposeBox, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto scrollbar-thin", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-2xl mx-auto px-4 py-4 space-y-3", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "bg-card border border-border rounded-xl p-4 space-y-3",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "w-10 h-10 rounded-full flex-shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3.5 w-32" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-full" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-3/4" })
          ] })
        ] })
      },
      i
    )) }) : posts.length > 0 ? posts.map((post) => /* @__PURE__ */ jsxRuntimeExports.jsx(PostCard, { post }, post.id.toString())) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex flex-col items-center justify-center py-20 text-center",
        "data-ocid": "feed-empty",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "w-12 h-12 text-muted-foreground/30 mb-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-semibold text-base text-foreground", children: "Nothing here yet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Be the first to post something to the community" })
        ]
      }
    ) }) })
  ] });
}
export {
  FeedPage as default
};

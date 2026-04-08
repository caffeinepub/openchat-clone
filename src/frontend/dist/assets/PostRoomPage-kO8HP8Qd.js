import { i as useParams, u as useNavigate, d as useAuth, f as useUploadFile, b as useGetFeedPosts, r as reactExports, j as jsxRuntimeExports, S as Skeleton, g as useLikePost, h as useUnlikePost, A as AvatarBubble } from "./index-D6YLhRqz.js";
import { u as useChatRoom, C as ChatMessageBubble, a as ChatComposeBar } from "./useChatRoom-CVQE7hsV.js";
import { A as ArrowLeft } from "./arrow-left-_JmFup3N.js";
import { H as Heart, M as MessageCircle } from "./message-circle-CVvKHBzG.js";
import "./send-CNhaVn4j.js";
function relativeTime(ts) {
  if (!ts || ts <= 0n) return "";
  const ms = ts > 1000000000000000n ? Number(ts / 1000000n) : Number(ts);
  const diff = Date.now() - ms;
  if (diff < 6e4) return "just now";
  if (diff < 36e5) return `${Math.floor(diff / 6e4)}m ago`;
  if (diff < 864e5) return `${Math.floor(diff / 36e5)}h ago`;
  return `${Math.floor(diff / 864e5)}d ago`;
}
function PinnedPostCard({ post }) {
  var _a, _b;
  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  const toggleLike = () => {
    if (post.likedByMe) {
      unlikePost.mutate({ postId: post.id });
    } else {
      likePost.mutate({ postId: post.id });
    }
  };
  const initials = post.author.displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const imageUrl = ((_a = post.content) == null ? void 0 : _a.kind) === "image" ? post.content.image.url : post.mediaKind === "image" ? post.mediaUrl : void 0;
  const videoUrl = ((_b = post.content) == null ? void 0 : _b.kind) === "video" ? post.content.video.url : post.mediaKind === "video" ? post.mediaUrl : void 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "flex-shrink-0 bg-card border-b border-border px-4 py-4",
      "data-ocid": "pinned-post-card",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarBubble, { initials, size: "md" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display font-semibold text-sm text-foreground", children: post.author.displayName }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[13px] text-muted-foreground flex-shrink-0", children: relativeTime(post.timestamp) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground/90 mt-1.5 leading-relaxed break-words", children: post.text }),
          imageUrl && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 rounded-lg overflow-hidden border border-border/50 bg-muted/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: imageUrl,
              alt: "Post attachment",
              className: "w-full max-h-52 object-cover",
              loading: "lazy"
            }
          ) }),
          videoUrl && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 rounded-lg overflow-hidden border border-border/50 bg-muted/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "video",
            {
              src: videoUrl,
              controls: true,
              className: "w-full max-h-48",
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
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5 text-sm text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: post.replyCount })
            ] })
          ] })
        ] })
      ] })
    }
  );
}
function ReplySkeletons() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 px-4 py-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "w-8 h-8 rounded-full flex-shrink-0 mt-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-24" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-56 rounded-2xl rounded-bl-sm" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-row-reverse gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 items-end flex flex-col", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-48 rounded-2xl rounded-br-sm" }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "w-8 h-8 rounded-full flex-shrink-0 mt-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-64 rounded-2xl rounded-bl-sm" })
      ] })
    ] })
  ] });
}
function EmptyReplies() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex flex-col items-center justify-center h-full text-center px-8",
      "data-ocid": "empty-replies",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "w-6 h-6 text-primary/50" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-semibold text-foreground text-sm", children: "No replies yet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-muted-foreground mt-1.5", children: "Be the first to join this conversation" })
      ]
    }
  );
}
function PostRoomPage() {
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
    refetch
  } = useChatRoom({
    roomType: "feed",
    roomId: postIdStr,
    currentUserId: (currentUser == null ? void 0 : currentUser.id) ?? "me",
    currentUserProfile: currentUser ?? {
      id: "me",
      displayName: "You",
      avatarInitials: "YO"
    }
  });
  const bottomRef = reactExports.useRef(null);
  const prevCountRef = reactExports.useRef(0);
  if (prevCountRef.current !== messages.length) {
    prevCountRef.current = messages.length;
    Promise.resolve().then(() => {
      var _a;
      (_a = bottomRef.current) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
    });
  }
  reactExports.useEffect(() => {
    const timer = setInterval(() => refetch(), 3e3);
    return () => clearInterval(timer);
  }, [refetch]);
  const currentUserId = (currentUser == null ? void 0 : currentUser.id) ?? "me";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex-1 flex flex-col h-full overflow-hidden",
      "data-ocid": "post-room-page",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0",
            "data-ocid": "post-room-header",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => navigate({ to: "/feed" }),
                  className: "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast flex-shrink-0",
                  "aria-label": "Back to Feed",
                  "data-ocid": "back-to-feed-btn",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-semibold text-sm text-foreground truncate", children: post ? post.author.displayName : "Post" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-muted-foreground", children: "Public chatroom" })
              ] })
            ]
          }
        ),
        post ? /* @__PURE__ */ jsxRuntimeExports.jsx(PinnedPostCard, { post }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 bg-card border-b border-border px-4 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "w-10 h-10 rounded-full flex-shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3.5 w-32" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-full" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-3/4" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex-1 overflow-y-auto scrollbar-thin bg-background",
            "data-ocid": "replies-list",
            children: [
              isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(ReplySkeletons, {}) : messages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyReplies, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-4 space-y-3", children: messages.map((msg) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                ChatMessageBubble,
                {
                  message: msg,
                  isOwn: msg.senderId === currentUserId || msg.senderId === "me",
                  currentUserId,
                  roomType: "feed",
                  inlineReactions: msg.reactions ?? [],
                  onDelete: () => deleteMessage(msg.id),
                  onEdit: (newText) => editMessage(msg.id, newText),
                  onPin: () => pinMessage(msg.id),
                  onUnpin: () => unpinMessage(msg.id),
                  onAddReaction: (emoji) => addReaction(msg.id, emoji),
                  onRemoveReaction: (emoji) => removeReaction(msg.id, emoji)
                },
                msg.id
              )) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: bottomRef, className: "h-2" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ChatComposeBar,
          {
            placeholder: "Reply to this post…",
            typingUsers,
            uploadFile: upload,
            onSendText: sendText,
            onSendMedia: (file, caption) => sendMedia(file, caption),
            onSendVoice: sendVoice,
            onSendVideo: sendVideo,
            onSendLink: sendLink,
            onTypingChange: setTyping
          }
        )
      ]
    }
  );
}
export {
  PostRoomPage as default
};

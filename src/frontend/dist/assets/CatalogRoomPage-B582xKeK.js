import { k as createLucideIcon, i as useParams, u as useNavigate, d as useAuth, f as useUploadFile, x as useGetCatalogRoom, y as useMarkCatalogRoomRead, q as useJoinCatalogRoom, z as useRemoveUserFromCatalogRoom, C as useReportCatalogRoom, r as reactExports, j as jsxRuntimeExports, X, A as AvatarBubble, S as Skeleton, U as Users } from "./index-BYCXRGdv.js";
import { u as useChatRoom, C as ChatMessageBubble, a as ChatComposeBar, P as Pin } from "./useChatRoom-CVAwwpKt.js";
import { A as ArrowLeft } from "./arrow-left-Bgic7ZmE.js";
import "./send-D_8Eh7Bs.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z", key: "i9b6wo" }],
  ["line", { x1: "4", x2: "4", y1: "22", y2: "15", key: "1cm3nv" }]
];
const Flag = createLucideIcon("flag", __iconNode);
function relativeTime(ms) {
  const diff = Date.now() - ms;
  if (diff < 6e4) return "just now";
  if (diff < 36e5) return `${Math.floor(diff / 6e4)}m ago`;
  if (diff < 864e5) return `${Math.floor(diff / 36e5)}h ago`;
  return `${Math.floor(diff / 864e5)}d ago`;
}
function getInitials(userId) {
  const parts = userId.split("-");
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : userId.slice(0, 2).toUpperCase();
}
function getDisplayName(userId) {
  const parts = userId.split("-");
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : userId.slice(0, 10);
}
function RoomHeader({
  room,
  onBack,
  onReport,
  onShowMembers
}) {
  const initials = room.title.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex-shrink-0 bg-card border-b border-border",
      "data-ocid": "catalog-room-header",
      children: [
        room.coverImageUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-20 overflow-hidden relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: room.coverImageUrl,
              alt: room.title,
              className: "w-full h-full object-cover"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-transparent to-card/80" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: onBack,
              className: "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast flex-shrink-0",
              "aria-label": "Back to Catalog",
              "data-ocid": "back-to-catalog-btn",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4" })
            }
          ),
          !room.coverImageUrl && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarBubble, { initials, size: "md" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-semibold text-sm text-foreground truncate", children: room.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-muted-foreground truncate max-w-xs", children: room.description })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 flex-shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: onShowMembers,
                "aria-label": "View members",
                "data-ocid": "view-members-btn",
                className: "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: onReport,
                "aria-label": "Report room",
                "data-ocid": "report-room-btn",
                className: "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors-fast",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Flag, { className: "w-4 h-4" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-4 pb-3 text-[13px] text-muted-foreground flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Created by",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary/80 font-medium", children: getDisplayName(room.creator) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-border", children: "·" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            room.members.length,
            " members"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-border", children: "·" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            room.messageCount,
            " messages"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-border", children: "·" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Active ",
            relativeTime(room.lastActivityAt)
          ] })
        ] })
      ]
    }
  );
}
function PinnedBar({ text, senderName }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-4 py-2 bg-primary/5 border-b border-primary/10 flex-shrink-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pin, { className: "w-3 h-3 text-primary/60 flex-shrink-0" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground truncate", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-primary/70", children: [
        senderName,
        ":"
      ] }),
      " ",
      text
    ] })
  ] });
}
function MembersPanel({
  room,
  currentUserId,
  onClose,
  onRemoveUser
}) {
  const isCreator = currentUserId === room.creator;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "absolute inset-0 z-20 bg-background/95 backdrop-blur-sm flex flex-col",
      "data-ocid": "members-panel",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: onClose,
              className: "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast",
              "aria-label": "Close members panel",
              "data-ocid": "close-members-btn",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-display font-semibold text-sm text-foreground", children: [
            "Members (",
            room.members.length,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-1", children: room.members.map((memberId) => {
          const initials = getInitials(memberId);
          const displayName = getDisplayName(memberId);
          const isRoomCreator = memberId === room.creator;
          const isSelf = memberId === currentUserId;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors-fast group",
              "data-ocid": `member-row-${memberId}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarBubble, { initials, size: "sm" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-display font-medium text-foreground truncate", children: [
                    displayName,
                    isSelf && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground ml-1.5", children: "(you)" })
                  ] }),
                  isRoomCreator && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-primary/70", children: "Room creator" })
                ] }),
                isCreator && !isSelf && !isRoomCreator && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => onRemoveUser(memberId),
                    "aria-label": `Remove ${displayName}`,
                    "data-ocid": `remove-user-${memberId}`,
                    className: "opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors-fast flex-shrink-0",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3.5 h-3.5" })
                  }
                )
              ]
            },
            memberId
          );
        }) })
      ]
    }
  );
}
function RoomHeaderSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 bg-card border-b border-border px-4 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "w-8 h-8 rounded-lg flex-shrink-0" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "w-10 h-10 rounded-full flex-shrink-0" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3.5 w-36" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-2.5 w-56" })
    ] })
  ] }) });
}
function MessageSkeletons() {
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
function CatalogRoomPage() {
  const { roomId } = useParams({ from: "/catalog/$roomId" });
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { upload } = useUploadFile();
  const {
    data: room,
    isLoading: roomLoading,
    refetch: refetchRoom
  } = useGetCatalogRoom(roomId);
  const markRead = useMarkCatalogRoomRead();
  const joinRoom = useJoinCatalogRoom();
  const removeUser = useRemoveUserFromCatalogRoom();
  const reportRoom = useReportCatalogRoom();
  const [showMembers, setShowMembers] = reactExports.useState(false);
  const [showReport, setShowReport] = reactExports.useState(false);
  const bottomRef = reactExports.useRef(null);
  const markReadMutate = markRead.mutate;
  reactExports.useEffect(() => {
    markReadMutate(roomId);
  }, [roomId, markReadMutate]);
  const joinRoomMutate = joinRoom.mutate;
  reactExports.useEffect(() => {
    if (!room || !currentUser) return;
    if (!room.members.includes(currentUser.id)) {
      joinRoomMutate({ roomId, currentUserId: currentUser.id });
    }
  }, [room, currentUser, roomId, joinRoomMutate]);
  reactExports.useEffect(() => {
    if (!showReport) return;
    const t = setTimeout(() => setShowReport(false), 4e3);
    return () => clearTimeout(t);
  }, [showReport]);
  reactExports.useEffect(() => {
    const timer = setInterval(() => refetchRoom(), 1e4);
    return () => clearInterval(timer);
  }, [refetchRoom]);
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
    refetch: refetchMessages
  } = useChatRoom({
    roomType: "catalog",
    roomId,
    currentUserId: (currentUser == null ? void 0 : currentUser.id) ?? "",
    currentUserProfile: currentUser ?? {
      id: "",
      displayName: "",
      avatarInitials: "?"
    }
  });
  const messageCount = messages.length;
  const prevCountRef = reactExports.useRef(0);
  if (prevCountRef.current !== messageCount) {
    prevCountRef.current = messageCount;
    Promise.resolve().then(() => {
      var _a;
      (_a = bottomRef.current) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
    });
  }
  reactExports.useEffect(() => {
    const timer = setInterval(() => refetchMessages(), 3e3);
    return () => clearInterval(timer);
  }, [refetchMessages]);
  const markReadRef = reactExports.useRef(markReadMutate);
  markReadRef.current = markReadMutate;
  const roomIdRef = reactExports.useRef(roomId);
  roomIdRef.current = roomId;
  reactExports.useEffect(() => {
    if (messageCount > 0) markReadRef.current(roomIdRef.current);
  }, [messageCount]);
  const isCreator = (currentUser == null ? void 0 : currentUser.id) === (room == null ? void 0 : room.creator);
  const handleRemoveUser = (userId) => {
    removeUser.mutate({ roomId, userId });
    setShowMembers(false);
  };
  const handleReport = () => {
    reportRoom.mutate({ roomId, reason: "reported" });
    setShowReport(true);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex-1 flex flex-col h-full overflow-hidden relative",
      "data-ocid": "catalog-room-page",
      children: [
        showMembers && room && currentUser && /* @__PURE__ */ jsxRuntimeExports.jsx(
          MembersPanel,
          {
            room,
            currentUserId: currentUser.id,
            onClose: () => setShowMembers(false),
            onRemoveUser: handleRemoveUser
          }
        ),
        roomLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(RoomHeaderSkeleton, {}) : room ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          RoomHeader,
          {
            room,
            onBack: () => navigate({ to: "/catalog" }),
            onReport: handleReport,
            onShowMembers: () => setShowMembers(true)
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-shrink-0 bg-card border-b border-border px-4 py-3 flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => navigate({ to: "/catalog" }),
              className: "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast",
              "aria-label": "Back to Catalog",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "Room not found" })
        ] }),
        pinnedMessages.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          PinnedBar,
          {
            text: pinnedMessages[pinnedMessages.length - 1].text,
            senderName: pinnedMessages[pinnedMessages.length - 1].senderName
          }
        ),
        showReport && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 mx-4 mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border text-xs text-muted-foreground",
            "data-ocid": "report-toast",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Flag, { className: "w-3 h-3 text-primary/60 flex-shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Room reported. Our team will review it shortly." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setShowReport(false),
                  "aria-label": "Dismiss",
                  className: "text-muted-foreground/50 hover:text-foreground transition-colors-fast ml-auto",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3 h-3" })
                }
              )
            ]
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex-1 overflow-y-auto scrollbar-thin bg-background",
            "data-ocid": "catalog-messages-list",
            children: [
              messagesLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSkeletons, {}) : messages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "flex flex-col items-center justify-center h-full text-center px-8",
                  "data-ocid": "empty-catalog-messages",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Flag, { className: "w-6 h-6 text-primary/50" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-semibold text-foreground text-sm", children: "No messages yet" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-muted-foreground mt-1.5", children: "Be the first to start the conversation" })
                  ]
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-4 space-y-3", children: messages.map((msg) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                ChatMessageBubble,
                {
                  message: msg,
                  isOwn: msg.senderId === (currentUser == null ? void 0 : currentUser.id),
                  currentUserId: (currentUser == null ? void 0 : currentUser.id) ?? "",
                  roomType: "catalog",
                  isRoomCreator: isCreator,
                  showProfileLink: false,
                  inlineReactions: msg.reactions,
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
            placeholder: "Send a message…",
            typingUsers,
            uploadFile: upload,
            onSendText: sendText,
            onSendMedia: sendMedia,
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
  CatalogRoomPage as default
};

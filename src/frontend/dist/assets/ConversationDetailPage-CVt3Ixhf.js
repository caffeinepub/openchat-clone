import { k as createLucideIcon, i as useParams, d as useAuth, u as useNavigate, D as useListConversations, E as useMarkConversationRead, r as reactExports, f as useUploadFile, j as jsxRuntimeExports, A as AvatarBubble, U as Users, S as Skeleton } from "./index-BYCXRGdv.js";
import { u as useChatRoom, C as ChatMessageBubble, a as ChatComposeBar, P as Pin, b as PinOff } from "./useChatRoom-CVAwwpKt.js";
import { A as ArrowLeft } from "./arrow-left-Bgic7ZmE.js";
import { S as Send } from "./send-D_8Eh7Bs.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]];
const ChevronDown = createLucideIcon("chevron-down", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [["path", { d: "m18 15-6-6-6 6", key: "153udz" }]];
const ChevronUp = createLucideIcon("chevron-up", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["circle", { cx: "12", cy: "12", r: "1", key: "41hilf" }],
  ["circle", { cx: "12", cy: "5", r: "1", key: "gxeob9" }],
  ["circle", { cx: "12", cy: "19", r: "1", key: "lyex9k" }]
];
const EllipsisVertical = createLucideIcon("ellipsis-vertical", __iconNode);
function MessageSkeletons() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 px-4 py-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "w-8 h-8 rounded-full flex-shrink-0 mt-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-24" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-14 w-56 rounded-2xl rounded-bl-sm" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-row-reverse gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 items-end flex flex-col", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-48 rounded-2xl rounded-br-sm" }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "w-8 h-8 rounded-full flex-shrink-0 mt-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-72 rounded-2xl rounded-bl-sm" })
      ] })
    ] })
  ] });
}
function EmptyMessages() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex flex-col items-center justify-center h-full text-center px-8",
      "data-ocid": "empty-messages",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "w-7 h-7 text-primary/50" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-semibold text-foreground text-sm", children: "No messages yet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-muted-foreground mt-1.5", children: "Say hello to start the conversation" })
      ]
    }
  );
}
function PinnedMessagesPanel({
  pinned,
  onUnpin
}) {
  const [expanded, setExpanded] = reactExports.useState(false);
  if (pinned.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "border-b border-border bg-card/80 flex-shrink-0",
      "data-ocid": "pinned-messages-panel",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => setExpanded((v) => !v),
            className: "w-full flex items-center gap-2 px-4 py-2 text-[13px] font-display font-semibold text-muted-foreground hover:text-foreground transition-colors-fast",
            "data-ocid": "pinned-toggle-btn",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Pin, { className: "w-3 h-3 text-primary/70" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-primary/80", children: [
                pinned.length,
                " pinned message",
                pinned.length > 1 ? "s" : ""
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1" }),
              expanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-3.5 h-3.5" })
            ]
          }
        ),
        expanded && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 pb-3 space-y-2 max-h-48 overflow-y-auto scrollbar-thin", children: pinned.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-start gap-2 rounded-lg bg-muted/40 border border-border px-3 py-2 group",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Pin, { className: "w-3 h-3 text-primary/50 flex-shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] font-display font-semibold text-foreground mb-0.5", children: p.senderName }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-foreground truncate", children: p.text })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  "aria-label": "Unpin message",
                  onClick: () => onUnpin(p.id),
                  className: "opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors-fast flex-shrink-0",
                  "data-ocid": "unpin-btn",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(PinOff, { className: "w-3 h-3" })
                }
              )
            ]
          },
          p.id
        )) })
      ]
    }
  );
}
function ConversationDetailPage() {
  const { id } = useParams({ from: "/conversations/$id" });
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { data: convList } = useListConversations();
  const conversation = convList == null ? void 0 : convList.find((c) => c.id === id);
  const markRead = useMarkConversationRead();
  const markReadMutate = markRead.mutate;
  reactExports.useEffect(() => {
    markReadMutate(id);
  }, [id, markReadMutate]);
  const currentUserId = (currentUser == null ? void 0 : currentUser.id) ?? "me";
  const currentUserProfile = currentUser ?? {
    id: currentUserId,
    displayName: "me",
    avatarInitials: "ME"
  };
  const chatRoom = useChatRoom({
    roomType: "group",
    roomId: id,
    currentUserId,
    currentUserProfile
  });
  const [showMembers, setShowMembers] = reactExports.useState(false);
  const { upload } = useUploadFile();
  const bottomRef = reactExports.useRef(null);
  const prevCountRef = reactExports.useRef(0);
  const messageCount = chatRoom.messages.length;
  if (prevCountRef.current !== messageCount) {
    prevCountRef.current = messageCount;
    Promise.resolve().then(() => {
      var _a;
      (_a = bottomRef.current) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
    });
  }
  reactExports.useEffect(() => {
    const timer = setInterval(() => chatRoom.refetch(), 3e3);
    return () => clearInterval(timer);
  }, [chatRoom.refetch]);
  const handleSendText = reactExports.useCallback(
    async (text) => {
      await chatRoom.sendText(text);
    },
    [chatRoom.sendText]
  );
  const handleSendMedia = reactExports.useCallback(
    async (file, caption) => {
      await chatRoom.sendMedia(file, caption);
    },
    [chatRoom.sendMedia]
  );
  const handleSendVoice = reactExports.useCallback(
    async (blob, durationSecs) => {
      await chatRoom.sendVoice(blob, durationSecs);
    },
    [chatRoom.sendVoice]
  );
  const handleSendVideo = reactExports.useCallback(
    async (blob, durationSecs, thumbnailBlob) => {
      await chatRoom.sendVideo(blob, durationSecs, thumbnailBlob);
    },
    [chatRoom.sendVideo]
  );
  const handleSendLink = reactExports.useCallback(
    async (url, caption) => {
      await chatRoom.sendLink(url, caption);
    },
    [chatRoom.sendLink]
  );
  const handleTypingChange = reactExports.useCallback(
    (isTyping) => {
      chatRoom.setTyping(isTyping);
    },
    [chatRoom.setTyping]
  );
  const handleDelete = reactExports.useCallback(
    (msg) => {
      chatRoom.deleteMessage(msg.id);
    },
    [chatRoom.deleteMessage]
  );
  const handleEdit = reactExports.useCallback(
    (msg, newText) => {
      chatRoom.editMessage(msg.id, newText);
    },
    [chatRoom.editMessage]
  );
  const handlePin = reactExports.useCallback(
    (msg) => {
      chatRoom.pinMessage(msg.id);
    },
    [chatRoom.pinMessage]
  );
  const handleUnpin = reactExports.useCallback(
    (msg) => {
      chatRoom.unpinMessage(msg.id);
    },
    [chatRoom.unpinMessage]
  );
  const handleAddReaction = reactExports.useCallback(
    (msg, emoji) => {
      chatRoom.addReaction(msg.id, emoji);
    },
    [chatRoom.addReaction]
  );
  const handleRemoveReaction = reactExports.useCallback(
    (msg, emoji) => {
      chatRoom.removeReaction(msg.id, emoji);
    },
    [chatRoom.removeReaction]
  );
  const convName = (conversation == null ? void 0 : conversation.name) ?? "Conversation";
  const convInitials = convName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col h-full overflow-hidden relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0",
        "data-ocid": "conv-header",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => navigate({ to: "/conversations" }),
              className: "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast md:hidden flex-shrink-0",
              "aria-label": "Back to conversations",
              "data-ocid": "back-btn",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarBubble, { initials: convInitials, size: "md" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-semibold text-sm text-foreground truncate", children: convName }),
            (conversation == null ? void 0 : conversation.type) === "group" && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[13px] text-muted-foreground", children: [
              conversation.memberIds.length,
              " members"
            ] }),
            (conversation == null ? void 0 : conversation.type) === "direct" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-primary/70", children: "Active now" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 flex-shrink-0", children: [
            (conversation == null ? void 0 : conversation.type) === "group" && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                "aria-label": "View members",
                "data-ocid": "view-members-btn",
                onClick: () => setShowMembers((v) => !v),
                className: "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                "aria-label": "More options",
                "data-ocid": "conv-more-options",
                className: "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(EllipsisVertical, { className: "w-4 h-4" })
              }
            )
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PinnedMessagesPanel,
      {
        pinned: chatRoom.pinnedMessages,
        onUnpin: (id2) => chatRoom.unpinMessage(id2)
      }
    ),
    showMembers && (conversation == null ? void 0 : conversation.type) === "group" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "border-b border-border bg-card/80 px-4 py-3 flex-shrink-0",
        "data-ocid": "members-panel",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[13px] font-display font-semibold text-muted-foreground mb-2", children: [
            "Members (",
            conversation.memberIds.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: conversation.memberIds.map((memberId) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: "text-[13px] bg-muted rounded-full px-2.5 py-1 text-foreground",
              children: memberId
            },
            memberId
          )) })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "flex-1 overflow-y-auto scrollbar-thin bg-background",
        "data-ocid": "messages-list",
        children: chatRoom.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSkeletons, {}) : !chatRoom.messages.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyMessages, {}) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-4 space-y-3", children: [
          chatRoom.messages.map((msg) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            ChatMessageBubble,
            {
              message: msg,
              isOwn: msg.senderId === currentUserId || msg.senderId === "me",
              currentUserId,
              roomType: "group",
              showProfileLink: true,
              onDelete: () => handleDelete(msg),
              onEdit: (newText) => handleEdit(msg, newText),
              onPin: () => handlePin(msg),
              onUnpin: () => handleUnpin(msg),
              onAddReaction: (emoji) => handleAddReaction(msg, emoji),
              onRemoveReaction: (emoji) => handleRemoveReaction(msg, emoji)
            },
            msg.id
          )),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: bottomRef, className: "h-2" })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ChatComposeBar,
      {
        typingUsers: chatRoom.typingUsers,
        uploadFile: upload,
        onSendText: handleSendText,
        onSendMedia: handleSendMedia,
        onSendVoice: handleSendVoice,
        onSendVideo: handleSendVideo,
        onSendLink: handleSendLink,
        onTypingChange: handleTypingChange
      }
    )
  ] });
}
export {
  ConversationDetailPage as default
};

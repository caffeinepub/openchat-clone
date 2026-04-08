import { k as createLucideIcon, i as useParams, d as useAuth, u as useNavigate, m as useGetProfile, n as useGetSharedConversations, l as useCreateDirectConversation, j as jsxRuntimeExports, S as Skeleton, B as Button, M as MessageSquare, U as Users, o as Link, A as AvatarBubble } from "./index-BYCXRGdv.js";
import { A as ArrowLeft } from "./arrow-left-Bgic7ZmE.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
  ["path", { d: "M3 10h18", key: "8toen8" }]
];
const Calendar = createLucideIcon("calendar", __iconNode);
function formatMemberSince(ts) {
  if (!ts) return "Unknown";
  return new Date(Number(ts)).toLocaleDateString([], {
    month: "long",
    year: "numeric"
  });
}
function UserProfilePage() {
  const { userId } = useParams({ from: "/profile/$userId" });
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useGetProfile(userId);
  const { data: sharedConvs = [], isLoading: loadingShared } = useGetSharedConversations(userId);
  const createDM = useCreateDirectConversation();
  const isOwnProfile = userId === (currentUser == null ? void 0 : currentUser.id) || userId === "me";
  const handleMessage = async () => {
    if (!profile) return;
    const conv = await createDM.mutateAsync({
      otherUserId: userId,
      displayName: profile.displayName
    });
    navigate({ to: "/conversations/$id", params: { id: conv.id } });
  };
  const initials = (profile == null ? void 0 : profile.avatarInitials) ?? userId.slice(0, 2).toUpperCase();
  const profileImageUrl = isOwnProfile ? currentUser == null ? void 0 : currentUser.profileImageUrl : profile == null ? void 0 : profile.profileImageUrl;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col h-full overflow-hidden bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0",
        "data-ocid": "profile-header",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => navigate({ to: -1 }),
              className: "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast flex-shrink-0",
              "aria-label": "Go back",
              "data-ocid": "back-btn",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-semibold text-sm text-foreground", children: isLoading ? "Profile" : (profile == null ? void 0 : profile.displayName) ?? "User Profile" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto scrollbar-thin", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-lg mx-auto px-4 py-8 space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "rounded-2xl bg-card border border-border p-6 flex flex-col items-center gap-4",
          "data-ocid": "profile-card",
          children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "w-20 h-20 rounded-full" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-36" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-24" })
          ] }) : profile ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            profileImageUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: profileImageUrl,
                alt: profile.displayName,
                className: "w-20 h-20 rounded-full object-cover border-2 border-border"
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-20 h-20 rounded-full bg-primary/20 text-primary flex items-center justify-center font-display font-bold text-2xl select-none", children: initials }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display font-bold text-xl text-foreground", children: profile.displayName }),
              profile.usernameHandle ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-primary mt-0.5 font-mono", children: [
                "@",
                profile.usernameHandle
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground mt-0.5 font-mono", children: [
                "@",
                userId.slice(0, 12)
              ] })
            ] }),
            profile.bio && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground text-center max-w-xs leading-relaxed", children: profile.bio }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-[13px] text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-3.5 h-3.5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "Member since",
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground font-medium", children: formatMemberSince(profile.memberSince) })
              ] })
            ] }),
            !isOwnProfile && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                onClick: handleMessage,
                disabled: createDM.isPending,
                "data-ocid": "message-user-btn",
                className: "gap-2 mt-1",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "w-4 h-4" }),
                  createDM.isPending ? "Opening chat…" : "Message"
                ]
              }
            )
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-7 h-7 text-muted-foreground/40" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground font-display", children: "User not found" })
          ] })
        }
      ),
      !isOwnProfile && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "shared-conversations-section", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-display font-semibold text-sm text-foreground mb-3 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-4 h-4 text-primary/70" }),
          "Shared groups"
        ] }),
        loadingShared ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: [1, 2].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center gap-3 rounded-xl bg-card border border-border px-4 py-3",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "w-9 h-9 rounded-full flex-shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3.5 w-28" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-20" })
              ] })
            ]
          },
          i
        )) }) : sharedConvs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "rounded-xl bg-card border border-border px-4 py-6 flex flex-col items-center text-center",
            "data-ocid": "no-shared-groups",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-8 h-8 text-muted-foreground/30 mb-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-muted-foreground", children: "No shared groups" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-muted-foreground/60 mt-1", children: "You and this user aren't in any groups together" })
            ]
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: sharedConvs.map((conv) => {
          const convInitials = conv.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Link,
            {
              to: "/conversations/$id",
              params: { id: conv.id },
              "data-ocid": `shared-conv-${conv.id}`,
              className: "flex items-center gap-3 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-primary/5 px-4 py-3 transition-colors-fast",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarBubble, { initials: convInitials, size: "sm" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-semibold text-sm text-foreground truncate", children: conv.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[13px] text-muted-foreground", children: [
                    conv.memberIds.length,
                    " members"
                  ] })
                ] })
              ]
            },
            conv.id
          );
        }) })
      ] })
    ] }) })
  ] });
}
export {
  UserProfilePage as default
};

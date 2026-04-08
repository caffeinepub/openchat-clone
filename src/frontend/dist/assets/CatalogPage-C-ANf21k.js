import { c as createLucideIcon, s as useGetCatalogRooms, t as useJoinCatalogRoom, b as useNavigate, a as useAuth, r as reactExports, j as jsxRuntimeExports, B as Button, P as Plus, v as Search, I as Input, X, w as Badge, M as MessageSquare, S as Skeleton, U as Users, x as useCreateCatalogRoom, f as useUploadFile, y as Label, L as LoaderCircle, T as Textarea } from "./index-Ci4uK3eq.js";
import { I as ImagePlus } from "./image-plus-BikO_JHz.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["polyline", { points: "12 6 12 12 16 14", key: "68esgv" }]
];
const Clock = createLucideIcon("clock", __iconNode);
function relativeTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 6e4) return "just now";
  if (diff < 36e5) return `${Math.floor(diff / 6e4)}m ago`;
  if (diff < 864e5) return `${Math.floor(diff / 36e5)}h ago`;
  return `${Math.floor(diff / 864e5)} days ago`;
}
function creatorInitials(creator) {
  return creator.slice(0, 2).toUpperCase();
}
function RoomCard({
  room,
  onEnter
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      onClick: () => onEnter(room),
      "data-ocid": `catalog-room-${room.id}`,
      className: "group rounded-xl overflow-hidden text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative h-36 bg-muted/40 overflow-hidden", children: [
          room.coverImageUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: room.coverImageUrl,
              alt: `${room.title} cover`,
              className: "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105",
              loading: "lazy"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "w-6 h-6 text-primary/60" }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-semibold text-sm text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors duration-200", children: room.title }),
          room.description && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground leading-relaxed line-clamp-2", children: [
            " ",
            room.description
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between pt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-display font-bold text-primary flex-shrink-0", children: creatorInitials(room.creator) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[13px] text-muted-foreground font-body truncate max-w-[80px]", children: room.creator })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-0.5 text-[13px] text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-3 h-3" }),
                room.members.length
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-0.5 text-[13px] text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "w-3 h-3" }),
                room.messageCount
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-[13px] text-muted-foreground/70", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-3 h-3 flex-shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "Active ",
              relativeTime(room.lastActivityAt)
            ] })
          ] })
        ] })
      ]
    }
  );
}
function RoomCardSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-36 w-full rounded-none" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-3/4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-full" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-2/3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between pt-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-16" })
      ] })
    ] })
  ] });
}
function CreateRoomModal({ onClose }) {
  const { currentUser } = useAuth();
  const createRoom = useCreateCatalogRoom();
  const navigate = useNavigate();
  const { upload } = useUploadFile();
  const [title, setTitle] = reactExports.useState("");
  const [description, setDescription] = reactExports.useState("");
  const [coverFile, setCoverFile] = reactExports.useState(null);
  const [coverPreview, setCoverPreview] = reactExports.useState(null);
  const [isUploading, setIsUploading] = reactExports.useState(false);
  const [uploadProgress, setUploadProgress] = reactExports.useState(0);
  const [uploadError, setUploadError] = reactExports.useState(null);
  const [isDraggingOver, setIsDraggingOver] = reactExports.useState(false);
  const fileInputRef = reactExports.useRef(null);
  const canCreate = title.trim().length > 0 && !isUploading && !createRoom.isPending;
  const handleFileSelect = reactExports.useCallback((file) => {
    if (!file.type.startsWith("image/")) return;
    setCoverFile(file);
    setCoverPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }, []);
  const handleFileInput = (e) => {
    var _a;
    const file = (_a = e.target.files) == null ? void 0 : _a[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };
  const handleDrop = reactExports.useCallback(
    (e) => {
      e.preventDefault();
      setIsDraggingOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );
  const removeCover = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);
  };
  const handleCreate = async () => {
    if (!canCreate || !currentUser) return;
    setUploadError(null);
    let coverImageUrl;
    if (coverFile) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        coverImageUrl = await upload(coverFile, (p) => setUploadProgress(p));
      } catch (err) {
        setIsUploading(false);
        setUploadError(
          err instanceof Error ? err.message : "Failed to upload cover image — please try again."
        );
        return;
      } finally {
        setIsUploading(false);
      }
    }
    const room = await createRoom.mutateAsync({
      title: title.trim(),
      description: description.trim(),
      coverImageUrl,
      currentUserId: currentUser.id
    });
    onClose();
    navigate({ to: "/catalog/$roomId", params: { roomId: room.id } });
  };
  return (
    // Backdrop
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/60 backdrop-blur-sm",
        "data-ocid": "create-room-modal",
        onClick: (e) => {
          if (e.target === e.currentTarget) onClose();
        },
        onKeyDown: (e) => {
          if (e.key === "Escape") onClose();
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display font-semibold text-base text-foreground", children: "Create Room" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: onClose,
                "aria-label": "Close",
                className: "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors duration-150",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin", children: [
            uploadError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs", children: [
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
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Label,
                {
                  htmlFor: "room-title",
                  className: "text-sm font-display font-medium text-muted-foreground uppercase tracking-wide",
                  children: [
                    "Room Title ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-destructive", children: "*" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "room-title",
                  value: title,
                  onChange: (e) => setTitle(e.target.value),
                  placeholder: "e.g. ICP Developer Lounge",
                  "data-ocid": "create-room-title",
                  maxLength: 80,
                  className: "bg-background border-input text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-sm font-display font-medium text-muted-foreground uppercase tracking-wide", children: [
                "Cover Image",
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "normal-case text-muted-foreground/50", children: "(optional)" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  ref: fileInputRef,
                  type: "file",
                  accept: "image/*",
                  onChange: handleFileInput,
                  className: "hidden",
                  "aria-label": "Upload cover image"
                }
              ),
              coverPreview ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative rounded-xl overflow-hidden border border-border bg-muted/20", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "img",
                  {
                    src: coverPreview,
                    alt: "Cover preview",
                    className: "w-full h-40 object-cover"
                  }
                ),
                isUploading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-6 h-6 text-primary animate-spin" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-mono text-foreground", children: [
                    Math.round(uploadProgress),
                    "%"
                  ] })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: removeCover,
                    "aria-label": "Remove cover image",
                    className: "absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 border border-border/60 flex items-center justify-center text-foreground hover:bg-background transition-colors duration-150",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3.5 h-3.5" })
                  }
                )
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    var _a;
                    return (_a = fileInputRef.current) == null ? void 0 : _a.click();
                  },
                  onDrop: handleDrop,
                  onDragOver: (e) => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                  },
                  onDragLeave: () => setIsDraggingOver(false),
                  "data-ocid": "create-room-image-upload",
                  className: `w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors duration-150 ${isDraggingOver ? "border-primary bg-primary/5 text-primary" : "border-border bg-muted/10 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ImagePlus, { className: "w-6 h-6" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-body", children: isDraggingOver ? "Drop to upload" : "Upload image or drag & drop" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Label,
                {
                  htmlFor: "room-description",
                  className: "text-sm font-display font-medium text-muted-foreground uppercase tracking-wide",
                  children: [
                    "Description",
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "normal-case text-muted-foreground/50", children: "(optional)" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Textarea,
                {
                  id: "room-description",
                  value: description,
                  onChange: (e) => setDescription(e.target.value),
                  placeholder: "What is this room about?",
                  "data-ocid": "create-room-description",
                  maxLength: 280,
                  rows: 3,
                  className: "bg-background border-input text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary resize-none"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-5 py-4 border-t border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                onClick: onClose,
                "data-ocid": "create-room-cancel",
                className: "flex-1",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                onClick: handleCreate,
                disabled: !canCreate || createRoom.isPending || isUploading,
                "data-ocid": "create-room-submit",
                className: "flex-1 bg-primary text-primary-foreground hover:opacity-90",
                children: createRoom.isPending || isUploading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin mr-2" }),
                  isUploading ? "Uploading…" : "Creating…"
                ] }) : "Create"
              }
            )
          ] })
        ] })
      }
    )
  );
}
function CatalogPage() {
  const { data: rooms = [], isLoading } = useGetCatalogRooms();
  const joinRoom = useJoinCatalogRoom();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [search, setSearch] = reactExports.useState("");
  const [showCreateModal, setShowCreateModal] = reactExports.useState(false);
  const filtered = search.trim() ? rooms.filter((r) => r.title.toLowerCase().includes(search.toLowerCase())) : rooms;
  const handleEnterRoom = (room) => {
    if (currentUser && !room.members.includes(currentUser.id)) {
      joinRoom.mutate({ roomId: room.id, currentUserId: currentUser.id });
    }
    navigate({ to: "/catalog/$roomId", params: { roomId: room.id } });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex flex-col h-full bg-background",
      "data-ocid": "catalog-page",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 px-5 py-4 bg-card border-b border-border flex-shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "svg",
              {
                xmlns: "http://www.w3.org/2000/svg",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                className: "w-4 h-4 text-primary",
                "aria-hidden": "true",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" })
                ]
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-semibold text-base text-foreground leading-tight", children: "Catalog" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-muted-foreground", children: "Browse and create community rooms" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: () => setShowCreateModal(true),
              "data-ocid": "catalog-create-btn",
              size: "sm",
              className: "flex items-center gap-1.5 bg-primary text-primary-foreground hover:opacity-90 flex-shrink-0",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3.5 h-3.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Create Room" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sm:hidden", children: "Create" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-3 border-b border-border bg-card/50 flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative max-w-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: search,
              onChange: (e) => setSearch(e.target.value),
              placeholder: "Search rooms…",
              "data-ocid": "catalog-search",
              className: "pl-9 bg-background border-input text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary h-9"
            }
          ),
          search && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => setSearch(""),
              "aria-label": "Clear search",
              className: "absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-150",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3.5 h-3.5" })
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto scrollbar-thin", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
          search.trim() && !isLoading && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-muted-foreground", children: filtered.length === 0 ? "No rooms match your search" : `${filtered.length} room${filtered.length !== 1 ? "s" : ""} found` }),
            filtered.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-[13px] px-1.5 py-0", children: filtered.length })
          ] }),
          isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3", children: Array.from({ length: 8 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items have no identity
            /* @__PURE__ */ jsxRuntimeExports.jsx(RoomCardSkeleton, {}, i)
          )) }) : filtered.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3", children: filtered.map((room) => /* @__PURE__ */ jsxRuntimeExports.jsx(RoomCard, { room, onEnter: handleEnterRoom }, room.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "flex flex-col items-center justify-center py-24 text-center",
              "data-ocid": "catalog-empty",
              children: search.trim() ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "w-12 h-12 text-muted-foreground/25 mb-4" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-semibold text-base text-foreground", children: "No rooms found" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground mt-1 max-w-xs", children: [
                  "Try a different search term or",
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => {
                        setSearch("");
                        setShowCreateModal(true);
                      },
                      className: "text-primary hover:underline",
                      children: "create a new room"
                    }
                  )
                ] })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "w-7 h-7 text-primary/60" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-semibold text-base text-foreground", children: "No rooms yet" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1 mb-5 max-w-xs", children: "Be the first to create a room for the community to discover and join" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    onClick: () => setShowCreateModal(true),
                    "data-ocid": "catalog-empty-create-btn",
                    className: "flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }),
                      "Create the first room"
                    ]
                  }
                )
              ] })
            }
          )
        ] }) }),
        showCreateModal && /* @__PURE__ */ jsxRuntimeExports.jsx(CreateRoomModal, { onClose: () => setShowCreateModal(false) })
      ]
    }
  );
}
export {
  CatalogPage as default
};

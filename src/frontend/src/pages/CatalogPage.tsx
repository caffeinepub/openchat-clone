import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  Clock,
  ImagePlus,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  useCreateCatalogRoom,
  useGetCatalogRooms,
  useJoinCatalogRoom,
} from "../hooks/useBackend";
import { useUploadFile } from "../hooks/useUploadFile";
import type { CatalogRoom } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)} days ago`;
}

function creatorInitials(creator: string): string {
  return creator.slice(0, 2).toUpperCase();
}

// ─── Room card ────────────────────────────────────────────────────────────────

function RoomCard({
  room,
  onEnter,
}: {
  room: CatalogRoom;
  onEnter: (room: CatalogRoom) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onEnter(room)}
      data-ocid={`catalog-room-${room.id}`}
      className="group rounded-xl overflow-hidden text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Cover image */}
      <div className="relative h-36 bg-muted/40 overflow-hidden">
        {room.coverImageUrl ? (
          <img
            src={room.coverImageUrl}
            alt={`${room.title} cover`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary/60" />
            </div>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
      </div>

      {/* Card body */}
      <div className="p-3 space-y-2">
        <h3 className="font-display font-semibold text-sm text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors duration-200">
          {room.title}
        </h3>

        {room.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {" "}
            {room.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-display font-bold text-primary flex-shrink-0">
              {creatorInitials(room.creator)}
            </div>
            <span className="text-[13px] text-muted-foreground font-body truncate max-w-[80px]">
              {room.creator}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-0.5 text-[13px] text-muted-foreground">
              <Users className="w-3 h-3" />
              {room.members.length}
            </span>
            <span className="flex items-center gap-0.5 text-[13px] text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              {room.messageCount}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[13px] text-muted-foreground/70">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span>Active {relativeTime(room.lastActivityAt)}</span>
        </div>
      </div>
    </button>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function RoomCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

// ─── Create Room modal ────────────────────────────────────────────────────────

function CreateRoomModal({ onClose }: { onClose: () => void }) {
  const { currentUser } = useAuth();
  const createRoom = useCreateCatalogRoom();
  const navigate = useNavigate();
  const { upload } = useUploadFile();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canCreate =
    title.trim().length > 0 && !isUploading && !createRoom.isPending;

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setCoverFile(file);
    setCoverPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const removeCover = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);
  };

  const handleCreate = async () => {
    if (!canCreate || !currentUser) return;
    setUploadError(null);

    let coverImageUrl: string | undefined;

    if (coverFile) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        coverImageUrl = await upload(coverFile, (p) => setUploadProgress(p));
      } catch (err) {
        setIsUploading(false);
        setUploadError(
          err instanceof Error
            ? err.message
            : "Failed to upload cover image — please try again.",
        );
        // Do NOT create the room — user must fix the upload first
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const room = await createRoom.mutateAsync({
      title: title.trim(),
      description: description.trim(),
      coverImageUrl,
      currentUserId: currentUser.id,
    });

    onClose();
    navigate({ to: "/catalog/$roomId", params: { roomId: room.id } });
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/60 backdrop-blur-sm"
      data-ocid="create-room-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-base text-foreground">
            Create Room
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* Upload error banner */}
          {uploadError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
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
          {/* Room title */}
          <div className="space-y-1.5">
            <Label
              htmlFor="room-title"
              className="text-sm font-display font-medium text-muted-foreground uppercase tracking-wide"
            >
              Room Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="room-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. ICP Developer Lounge"
              data-ocid="create-room-title"
              maxLength={80}
              className="bg-background border-input text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary"
            />
          </div>

          {/* Cover image upload */}
          <div className="space-y-1.5">
            <Label className="text-sm font-display font-medium text-muted-foreground uppercase tracking-wide">
              Cover Image{" "}
              <span className="normal-case text-muted-foreground/50">
                (optional)
              </span>
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              aria-label="Upload cover image"
            />
            {coverPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border bg-muted/20">
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-full h-40 object-cover"
                />
                {isUploading ? (
                  <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <span className="text-xs font-mono text-foreground">
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={removeCover}
                    aria-label="Remove cover image"
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 border border-border/60 flex items-center justify-center text-foreground hover:bg-background transition-colors duration-150"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                data-ocid="create-room-image-upload"
                className={`w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors duration-150 ${
                  isDraggingOver
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-muted/10 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                }`}
              >
                <ImagePlus className="w-6 h-6" />
                <span className="text-xs font-body">
                  {isDraggingOver
                    ? "Drop to upload"
                    : "Upload image or drag & drop"}
                </span>
              </button>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label
              htmlFor="room-description"
              className="text-sm font-display font-medium text-muted-foreground uppercase tracking-wide"
            >
              Description{" "}
              <span className="normal-case text-muted-foreground/50">
                (optional)
              </span>
            </Label>
            <Textarea
              id="room-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this room about?"
              data-ocid="create-room-description"
              maxLength={280}
              rows={3}
              className="bg-background border-input text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary resize-none"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="create-room-cancel"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!canCreate || createRoom.isPending || isUploading}
            data-ocid="create-room-submit"
            className="flex-1 bg-primary text-primary-foreground hover:opacity-90"
          >
            {createRoom.isPending || isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {isUploading ? "Uploading…" : "Creating…"}
              </>
            ) : (
              "Create"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Catalog page ─────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const { data: rooms = [], isLoading } = useGetCatalogRooms();
  const joinRoom = useJoinCatalogRoom();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = search.trim()
    ? rooms.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))
    : rooms;

  const handleEnterRoom = (room: CatalogRoom) => {
    if (currentUser && !room.members.includes(currentUser.id)) {
      joinRoom.mutate({ roomId: room.id, currentUserId: currentUser.id });
    }
    navigate({ to: "/catalog/$roomId", params: { roomId: room.id } });
  };

  return (
    <div
      className="flex flex-col h-full bg-background"
      data-ocid="catalog-page"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 bg-card border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-primary"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-semibold text-base text-foreground leading-tight">
              Catalog
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Browse and create community rooms
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          data-ocid="catalog-create-btn"
          size="sm"
          className="flex items-center gap-1.5 bg-primary text-primary-foreground hover:opacity-90 flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Create Room</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </div>

      {/* Search bar */}
      <div className="px-4 py-3 border-b border-border bg-card/50 flex-shrink-0">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms…"
            data-ocid="catalog-search"
            className="pl-9 bg-background border-input text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary h-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Room grid */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-4">
          {/* Results count when searching */}
          {search.trim() && !isLoading && (
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[13px] text-muted-foreground">
                {filtered.length === 0
                  ? "No rooms match your search"
                  : `${filtered.length} room${filtered.length !== 1 ? "s" : ""} found`}
              </p>
              {filtered.length > 0 && (
                <Badge variant="secondary" className="text-[13px] px-1.5 py-0">
                  {filtered.length}
                </Badge>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items have no identity
                <RoomCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((room) => (
                <RoomCard key={room.id} room={room} onEnter={handleEnterRoom} />
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-24 text-center"
              data-ocid="catalog-empty"
            >
              {search.trim() ? (
                <>
                  <Search className="w-12 h-12 text-muted-foreground/25 mb-4" />
                  <p className="font-display font-semibold text-base text-foreground">
                    No rooms found
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Try a different search term or{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setShowCreateModal(true);
                      }}
                      className="text-primary hover:underline"
                    >
                      create a new room
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                    <MessageSquare className="w-7 h-7 text-primary/60" />
                  </div>
                  <p className="font-display font-semibold text-base text-foreground">
                    No rooms yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-xs">
                    Be the first to create a room for the community to discover
                    and join
                  </p>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    data-ocid="catalog-empty-create-btn"
                    className="flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90"
                  >
                    <Plus className="w-4 h-4" />
                    Create the first room
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create room modal */}
      {showCreateModal && (
        <CreateRoomModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Loader2, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useUpdateProfile } from "../hooks/useBackend";
import { useUploadFile } from "../hooks/useUploadFile";

const HANDLE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function daysUntilHandleChange(lastChangeMs: number): number {
  const elapsed = Date.now() - lastChangeMs;
  const remaining = HANDLE_COOLDOWN_MS - elapsed;
  return Math.max(1, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

interface Props {
  onClose: () => void;
}

export default function EditProfileModal({ onClose }: Props) {
  const { currentUser, updateCurrentUser } = useAuth();
  const updateProfile = useUpdateProfile();
  const { upload } = useUploadFile();

  const [displayName, setDisplayName] = useState(
    currentUser?.displayName ?? "",
  );
  const [bio, setBio] = useState(currentUser?.bio ?? "");
  const [handle, setHandle] = useState(currentUser?.usernameHandle ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(
    currentUser?.profileImageUrl ?? null,
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    currentUser?.profileImageUrl ?? null,
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCooldown =
    currentUser?.lastHandleChange != null &&
    Date.now() - currentUser.lastHandleChange < HANDLE_COOLDOWN_MS;

  const daysLeft = handleCooldown
    ? daysUntilHandleChange(currentUser!.lastHandleChange!)
    : 0;

  // Revoke local preview on unmount
  useEffect(() => {
    return () => {
      if (imageFile && imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imageFile, imagePreview]);

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      if (imageFile && imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageUrl(null); // will be set after upload on save
    },
    [imageFile, imagePreview],
  );

  const handleRemoveImage = () => {
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
  };

  const initials = (displayName || currentUser?.displayName || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSave = async () => {
    if (!currentUser) return;
    setError(null);
    setIsSaving(true);
    try {
      let finalImageUrl: string | null | undefined = imageUrl;

      if (imageFile) {
        setIsUploadingImage(true);
        try {
          finalImageUrl = await upload(imageFile);
          // Validate persistent URL
          if (finalImageUrl && !finalImageUrl.startsWith("https://")) {
            throw new Error(
              "Upload returned a temporary URL — please try again.",
            );
          }
        } catch (uploadErr) {
          console.error("[EditProfileModal] Image upload error:", uploadErr);
          const msg =
            uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
          setError(`Image upload failed: ${msg}`);
          setIsSaving(false);
          setIsUploadingImage(false);
          return;
        }
        setIsUploadingImage(false);
      } else if (imagePreview === null) {
        // User explicitly removed the image
        finalImageUrl = null;
      }

      const handleChanged =
        handle.trim() !== (currentUser.usernameHandle ?? "");

      const updates: Parameters<typeof updateProfile.mutateAsync>[0] = {
        userId: currentUser.id,
        displayName: displayName.trim() || currentUser.displayName,
        profileImageUrl: finalImageUrl,
        bio: bio.trim(),
      };

      if (handleChanged && !handleCooldown) {
        updates.usernameHandle = handle.trim();
      }

      const updated = await updateProfile.mutateAsync(updates);

      updateCurrentUser({
        displayName: updated.displayName,
        profileImageUrl: updated.profileImageUrl,
        bio: updated.bio,
        usernameHandle: updated.usernameHandle,
        lastHandleChange: updated.lastHandleChange,
        avatarInitials: updated.avatarInitials,
      });

      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const busy = isSaving || isUploadingImage;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/60 backdrop-blur-sm"
      data-ocid="edit-profile-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-base text-foreground">
            Edit Profile
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

        {/* Body */}
        <div className="px-5 py-5 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* Profile picture */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/20 text-primary flex items-center justify-center font-display font-bold text-2xl select-none border-2 border-border">
                  {initials}
                </div>
              )}
              {/* Upload overlay on hover */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change profile picture"
                data-ocid="profile-pic-upload"
                className="absolute inset-0 rounded-full flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              >
                <Camera className="w-6 h-6 text-foreground" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="Upload profile picture"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
                e.target.value = "";
              }}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm h-7 px-3"
                data-ocid="change-photo-btn"
              >
                Change photo
              </Button>
              {imagePreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="text-sm h-7 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                  data-ocid="remove-photo-btn"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          </div>

          {/* Display name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="edit-display-name"
              className="text-sm font-display font-medium text-muted-foreground uppercase tracking-wide"
            >
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={60}
              data-ocid="edit-name-input"
              className="bg-background border-input text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary"
            />
          </div>

          {/* Username handle */}
          <div className="space-y-1.5">
            <Label
              htmlFor="edit-handle"
              className="text-sm font-display font-medium text-muted-foreground uppercase tracking-wide"
            >
              Username Handle{" "}
              <span className="normal-case text-muted-foreground/50">
                (optional)
              </span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">
                @
              </span>
              <Input
                id="edit-handle"
                value={handle}
                onChange={(e) =>
                  setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))
                }
                placeholder="yourhandle"
                maxLength={32}
                disabled={handleCooldown}
                data-ocid="edit-handle-input"
                className="pl-7 bg-background border-input text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            {handleCooldown && (
              <p
                className="text-[13px] text-muted-foreground/70"
                data-ocid="handle-cooldown-msg"
              >
                Next change available in{" "}
                <span className="text-foreground font-medium">
                  {daysLeft} {daysLeft === 1 ? "day" : "days"}
                </span>
              </p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label
              htmlFor="edit-bio"
              className="text-sm font-display font-medium text-muted-foreground uppercase tracking-wide"
            >
              Bio{" "}
              <span className="normal-case text-muted-foreground/50">
                (optional)
              </span>
            </Label>
            <Textarea
              id="edit-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself…"
              maxLength={200}
              rows={3}
              data-ocid="edit-bio-input"
              className="bg-background border-input text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary resize-none"
            />
            <p className="text-[13px] text-muted-foreground/50 text-right">
              {bio.length}/200
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={busy}
            data-ocid="edit-profile-cancel"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={busy || !displayName.trim()}
            data-ocid="edit-profile-save"
            className="flex-1 bg-primary text-primary-foreground hover:opacity-90"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {isUploadingImage ? "Uploading…" : "Saving…"}
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

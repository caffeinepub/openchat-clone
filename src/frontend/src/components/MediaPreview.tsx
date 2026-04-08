import { Film, Mic, X } from "lucide-react";
import type { PendingMedia } from "../types";

interface MediaPreviewProps {
  media: PendingMedia;
  onRemove: () => void;
}

export function MediaPreview({ media, onRemove }: MediaPreviewProps) {
  const isUploading = media.progress > 0 && media.progress < 100;

  return (
    <div
      className="relative inline-flex mt-2 rounded-xl overflow-hidden border border-border bg-muted/40"
      data-ocid="media-preview"
    >
      {/* Preview content */}
      {media.kind === "image" ? (
        <img
          src={media.previewUrl}
          alt="Attachment preview"
          className="w-28 h-28 object-cover"
          role="presentation"
        />
      ) : media.kind === "video" ? (
        <div className="w-28 h-28 flex flex-col items-center justify-center gap-2 px-3">
          <Film className="w-7 h-7 text-primary" />
          <span className="text-[10px] text-muted-foreground text-center truncate w-full">
            {media.file.name}
          </span>
        </div>
      ) : (
        <div className="w-28 h-20 flex flex-col items-center justify-center gap-2 px-3">
          <Mic className="w-7 h-7 text-primary" />
          <span className="text-[10px] text-muted-foreground text-center truncate w-full">
            {media.file.name}
          </span>
        </div>
      )}

      {/* Upload progress overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-1.5">
          {/* Circular progress */}
          <svg
            className="w-10 h-10 -rotate-90"
            viewBox="0 0 36 36"
            aria-hidden="true"
          >
            <circle
              className="text-border"
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <circle
              className="text-primary transition-all duration-300"
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 14}`}
              strokeDashoffset={`${2 * Math.PI * 14 * (1 - media.progress / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <span className="text-[10px] font-mono text-foreground">
            {Math.round(media.progress)}%
          </span>
        </div>
      )}

      {/* Remove button — hidden while uploading */}
      {!isUploading && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove attachment"
          data-ocid="remove-media-btn"
          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 border border-border flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors-fast shadow-sm"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

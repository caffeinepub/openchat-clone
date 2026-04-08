import { ExternalLink, X } from "lucide-react";
import type { LinkContent, LinkPreview } from "../types";

// ─── Inline preview (shown below the text input) ─────────────────────────────

interface LinkPreviewBannerProps {
  preview: LinkPreview;
  onDismiss: () => void;
}

export function LinkPreviewBanner({
  preview,
  onDismiss,
}: LinkPreviewBannerProps) {
  return (
    <div
      className="flex items-start gap-3 mt-2 p-3 rounded-xl border border-border bg-muted/30 relative"
      data-ocid="link-preview-banner"
    >
      {preview.imageUrl && (
        <img
          src={preview.imageUrl}
          alt=""
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-border"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-mono text-primary uppercase tracking-wider truncate">
          {preview.domain}
        </p>
        {preview.title && (
          <p className="text-[13px] font-semibold text-foreground leading-tight mt-0.5 line-clamp-1">
            {preview.title}
          </p>
        )}
        {preview.description && (
          <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
            {preview.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss link preview"
        data-ocid="dismiss-link-preview"
        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Message bubble (shown in chat for a sent link message) ───────────────────

interface LinkMessageBubbleProps {
  link: LinkContent;
  isOwn: boolean;
}

export function LinkMessageBubble({ link, isOwn }: LinkMessageBubbleProps) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block max-w-xs rounded-2xl overflow-hidden border transition-smooth hover:opacity-90 ${
        isOwn
          ? "rounded-br-sm border-primary/30 bg-primary/10"
          : "rounded-bl-sm border-border bg-card"
      }`}
      data-ocid="link-message-bubble"
    >
      {link.imageUrl && (
        <img
          src={link.imageUrl}
          alt=""
          className="w-full h-28 object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <div className="px-3 py-2.5 space-y-0.5">
        <div className="flex items-center gap-1.5">
          <ExternalLink className="w-3 h-3 flex-shrink-0 text-primary" />
          <span className="text-[13px] font-mono text-primary truncate">
            {(() => {
              try {
                return new URL(link.url).hostname;
              } catch {
                return link.url;
              }
            })()}
          </span>
        </div>
        {link.title && (
          <p className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2">
            {link.title}
          </p>
        )}
        {link.description && (
          <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
            {link.description}
          </p>
        )}
        <p className="text-[13px] text-primary/70 truncate pt-0.5">
          {link.url}
        </p>
      </div>
    </a>
  );
}

import {
  Film,
  Image as ImageIcon,
  Link as LinkIcon,
  Send,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LinkPreview, PendingMedia, UserProfile } from "../../types";
import { LinkPreviewBanner } from "../LinkPreviewCard";
import { MediaPreview } from "../MediaPreview";
import { TypingIndicator } from "../TypingIndicator";
import { VideoRecorder } from "../VideoRecorder";
import { VoiceRecorder } from "../VoiceRecorder";

// ─── File validation ──────────────────────────────────────────────────────────

const ACCEPTED_IMAGES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ACCEPTED_VIDEOS = ["video/mp4", "video/webm"];
const ACCEPTED_AUDIO = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_AUDIO_SIZE = 10 * 1024 * 1024;

const URL_REGEX = /https?:\/\/[^\s]+/gi;

type MediaKindLocal = "image" | "video" | "audio";

function getMimeKind(mimeType: string): MediaKindLocal | null {
  if (ACCEPTED_IMAGES.includes(mimeType)) return "image";
  if (ACCEPTED_VIDEOS.includes(mimeType)) return "video";
  if (ACCEPTED_AUDIO.includes(mimeType)) return "audio";
  return null;
}

function validateFile(
  file: File,
): { ok: true; kind: MediaKindLocal } | { ok: false; error: string } {
  const kind = getMimeKind(file.type);
  if (!kind) return { ok: false, error: `Unsupported file type: ${file.type}` };
  if (kind === "audio" && file.size > MAX_AUDIO_SIZE)
    return {
      ok: false,
      error: `Audio files must be under ${MAX_AUDIO_SIZE / 1024 / 1024}MB`,
    };
  const maxSize = kind === "video" ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (kind !== "audio" && file.size > maxSize)
    return {
      ok: false,
      error: `${kind === "video" ? "Videos" : "Images"} must be under ${maxSize / 1024 / 1024}MB`,
    };
  return { ok: true, kind };
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function detectUrl(text: string): string | null {
  const matches = text.match(URL_REGEX);
  return matches?.[0] ?? null;
}

// ─── Attach button ────────────────────────────────────────────────────────────

function AttachButton({
  icon: Icon,
  label,
  accept,
  onFile,
  disabled,
  ocid,
}: {
  icon: React.ElementType;
  label: string;
  accept: string;
  onFile: (file: File) => void;
  disabled: boolean;
  ocid: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={disabled}
        aria-label={label}
        data-ocid={ocid}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors-fast disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
      >
        <Icon className="w-4 h-4" />
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </>
  );
}

// ─── File error banner ────────────────────────────────────────────────────────

function FileErrorBanner({
  error,
  onDismiss,
}: {
  error: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs"
      data-ocid="file-error-banner"
    >
      <span className="flex-1">{error}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-destructive/70 hover:text-destructive transition-colors-fast"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Drop zone overlay ────────────────────────────────────────────────────────

function DropZoneOverlay({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary rounded-lg pointer-events-none"
      data-ocid="drop-zone-overlay"
    >
      <div className="w-16 h-16 rounded-2xl bg-card border border-primary/30 flex items-center justify-center mb-3 shadow-lg">
        <ImageIcon className="w-8 h-8 text-primary" />
      </div>
      <p className="font-display font-semibold text-foreground text-sm">
        Drop files to send
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Images · Videos · Audio
      </p>
    </div>
  );
}

// ─── Recording mode ───────────────────────────────────────────────────────────

type RecordingMode = "none" | "voice" | "video";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ChatComposeBarProps {
  /** Placeholder text for the textarea */
  placeholder?: string;
  typingUsers?: UserProfile[];
  isSending?: boolean;
  /** Upload an image/video/audio file and receive back a permanent URL */
  uploadFile: (file: File, onProgress?: (p: number) => void) => Promise<string>;
  onSendText: (text: string) => Promise<void> | void;
  onSendMedia: (file: File, caption: string) => Promise<void> | void;
  onSendVoice: (blob: Blob, durationSecs: number) => Promise<void> | void;
  onSendVideo: (
    blob: Blob,
    durationSecs: number,
    thumbnailBlob?: Blob,
  ) => Promise<void> | void;
  onSendLink?: (url: string, caption: string) => Promise<void> | void;
  onTypingChange?: (isTyping: boolean) => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ChatComposeBar({
  placeholder = "Send a message…",
  typingUsers = [],
  isSending = false,
  uploadFile,
  onSendText,
  onSendMedia,
  onSendVoice,
  onSendVideo,
  onSendLink,
  onTypingChange,
}: ChatComposeBarProps) {
  const [text, setText] = useState("");
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [linkDismissed, setLinkDismissed] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>("none");

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isTypingRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Link detection ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (linkDismissed) return;
    const url = detectUrl(text);
    if (!url) {
      setLinkPreview(null);
      return;
    }
    setLinkPreview({ url, domain: extractDomain(url) });
  }, [text, linkDismissed]);

  useEffect(() => {
    if (!detectUrl(text)) setLinkDismissed(false);
  }, [text]);

  // ── File selection ──────────────────────────────────────────────────────────

  const handleFileSelected = useCallback(
    async (file: File) => {
      const validation = validateFile(file);
      if (!validation.ok) {
        setFileError(validation.error);
        return;
      }
      setFileError(null);
      const previewUrl = URL.createObjectURL(file);
      setPendingMedia({ kind: validation.kind, file, previewUrl, progress: 0 });

      try {
        const permanentUrl = await uploadFile(file, (p) => {
          setPendingMedia((prev) => (prev ? { ...prev, progress: p } : null));
        });

        // Validate that we received a real persistent URL, not a temp blob: URL
        if (!permanentUrl.startsWith("https://")) {
          console.error(
            "[ChatComposeBar] Upload returned a non-persistent URL:",
            permanentUrl,
          );
          throw new Error(
            "Upload returned a temporary URL — storage upload likely failed.",
          );
        }

        setPendingMedia((prev) =>
          prev ? { ...prev, progress: 100, uploadedUrl: permanentUrl } : null,
        );
      } catch (uploadErr) {
        // Log the FULL error so the 403 details are visible in the browser console
        console.error("[ChatComposeBar] File upload error:", uploadErr);
        const message =
          uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
        setFileError(`Upload failed: ${message}`);
        URL.revokeObjectURL(previewUrl);
        setPendingMedia(null);
      }
    },
    [uploadFile],
  );

  // ── Drag and drop ───────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        await handleFileSelected(file);
      }
    },
    [handleFileSelected],
  );

  // ── Typing ──────────────────────────────────────────────────────────────────

  const handleTextChange = useCallback(
    (value: string) => {
      setText(value);
      if (!onTypingChange) return;

      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTypingChange(true);
      }
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        isTypingRef.current = false;
        onTypingChange(false);
      }, 3000);
    },
    [onTypingChange],
  );

  // ── Recording handlers ──────────────────────────────────────────────────────

  const handleVoiceSend = useCallback(
    async (blob: Blob, durationSecs: number) => {
      setRecordingMode("none");
      await onSendVoice(blob, durationSecs);
    },
    [onSendVoice],
  );

  const handleVideoSend = useCallback(
    async (blob: Blob, durationSecs: number, thumbnailBlob?: Blob) => {
      setRecordingMode("none");
      await onSendVideo(blob, durationSecs, thumbnailBlob);
    },
    [onSendVideo],
  );

  const handleRecordingCancel = useCallback(() => {
    setRecordingMode("none");
  }, []);

  // ── Send ────────────────────────────────────────────────────────────────────

  const isUploading = pendingMedia !== null && pendingMedia.progress < 100;
  const canSend =
    !isUploading &&
    !isSending &&
    (!!text.trim() || !!pendingMedia?.uploadedUrl);

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    const trimmed = text.trim();

    // Stop typing indicator
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (isTypingRef.current && onTypingChange) {
      isTypingRef.current = false;
      onTypingChange(false);
    }

    if (pendingMedia?.uploadedUrl) {
      await onSendMedia(pendingMedia.file, trimmed);
      URL.revokeObjectURL(pendingMedia.previewUrl);
      setPendingMedia(null);
    } else if (linkPreview && !linkDismissed && onSendLink) {
      await onSendLink(linkPreview.url, trimmed);
      setLinkPreview(null);
    } else if (trimmed) {
      await onSendText(trimmed);
    }

    setText("");
    inputRef.current?.focus();
  }, [
    canSend,
    text,
    pendingMedia,
    linkPreview,
    linkDismissed,
    onTypingChange,
    onSendMedia,
    onSendText,
    onSendLink,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isRecording = recordingMode !== "none";

  return (
    <div
      className="flex-shrink-0 border-t border-border bg-card px-4 py-3 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-ocid="chat-compose-bar"
    >
      <DropZoneOverlay active={isDragOver} />

      {/* Video recorder — expands above input row */}
      {recordingMode === "video" && (
        <div className="mb-3">
          <VideoRecorder
            disabled={false}
            onSend={handleVideoSend}
            onCancel={handleRecordingCancel}
            onStateChange={(active) => {
              if (!active) setRecordingMode("none");
            }}
          />
        </div>
      )}

      {/* File error */}
      {fileError && (
        <FileErrorBanner
          error={fileError}
          onDismiss={() => setFileError(null)}
        />
      )}

      {/* Media preview */}
      {pendingMedia && (
        <MediaPreview
          media={pendingMedia}
          onRemove={() => {
            URL.revokeObjectURL(pendingMedia.previewUrl);
            setPendingMedia(null);
          }}
        />
      )}

      {/* Link preview */}
      {linkPreview && !linkDismissed && (
        <LinkPreviewBanner
          preview={linkPreview}
          onDismiss={() => setLinkDismissed(true)}
        />
      )}

      {/* Typing indicator */}
      <TypingIndicator typingUsers={typingUsers} />

      {/* Input row */}
      <div className="flex items-end gap-2 mt-1">
        {/* Attachment buttons — hidden while recording */}
        {!isRecording && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <AttachButton
              icon={ImageIcon}
              label="Attach image"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onFile={handleFileSelected}
              disabled={isUploading || isSending}
              ocid="attach-image-btn"
            />
            <AttachButton
              icon={Film}
              label="Attach video file"
              accept="video/mp4,video/webm"
              onFile={handleFileSelected}
              disabled={isUploading || isSending}
              ocid="attach-video-btn"
            />
            {onSendLink && (
              <button
                type="button"
                onClick={() => {
                  const url = window.prompt("Enter URL");
                  if (url?.trim()) onSendLink(url.trim(), text.trim());
                }}
                disabled={isUploading || isSending}
                aria-label="Attach link"
                data-ocid="attach-link-btn"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors-fast disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Voice recorder — overlays text input when active */}
        {recordingMode === "voice" ? (
          <VoiceRecorder
            disabled={false}
            onSend={handleVoiceSend}
            onCancel={handleRecordingCancel}
            onStateChange={(active) => {
              if (!active) setRecordingMode("none");
            }}
          />
        ) : recordingMode === "video" ? (
          <div className="flex-1 flex items-center px-3 h-10 rounded-xl border border-primary/30 bg-primary/5 text-xs text-muted-foreground font-display">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse mr-2 flex-shrink-0" />
            Video recording…
          </div>
        ) : (
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            data-ocid="message-input"
            aria-label="Message input"
            disabled={isUploading}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body max-h-32 scrollbar-thin transition-smooth disabled:opacity-50 leading-relaxed"
            style={{ minHeight: "42px" }}
          />
        )}

        {/* Voice record button — idle only */}
        {recordingMode === "none" && (
          <VoiceRecorder
            disabled={isUploading || isSending}
            onSend={handleVoiceSend}
            onCancel={handleRecordingCancel}
            onStateChange={(active) => {
              if (active) setRecordingMode("voice");
            }}
          />
        )}

        {/* Video record button — idle only */}
        {recordingMode === "none" && (
          <VideoRecorder
            disabled={isUploading || isSending}
            onSend={handleVideoSend}
            onCancel={handleRecordingCancel}
            onStateChange={(active) => {
              if (active) setRecordingMode("video");
            }}
          />
        )}

        {/* Send button — hidden during voice recording (voice has its own send) */}
        {recordingMode !== "voice" && (
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend || recordingMode !== "none"}
            data-ocid="send-message-btn"
            aria-label="Send message"
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 transition-smooth hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>

      {!isRecording && (
        <p className="text-[10px] text-muted-foreground/40 mt-1.5 ml-1 select-none">
          Enter to send · Shift+Enter for new line · Drag &amp; drop files to
          attach
          {isUploading && (
            <span className="ml-2 text-primary animate-pulse">Uploading…</span>
          )}
        </p>
      )}
    </div>
  );
}

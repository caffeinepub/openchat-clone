import { Send, Video, VideoOff, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CameraState = "idle" | "viewfinder" | "recording" | "preview" | "error";

interface VideoRecorderProps {
  disabled?: boolean;
  /** Called with the recorded video blob, duration in seconds, and thumbnail blob (may be undefined) */
  onSend: (blob: Blob, durationSecs: number, thumbnailBlob?: Blob) => void;
  onCancel: () => void;
  onStateChange?: (active: boolean) => void;
}

// ─── Timer ────────────────────────────────────────────────────────────────────

function useTimer(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (running) {
      setElapsed(0);
      startRef.current = Date.now();
      const tick = () => {
        setElapsed(
          Math.floor((Date.now() - (startRef.current ?? Date.now())) / 1000),
        );
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    }
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [running]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  return { elapsed, label: `${mm}:${ss}` };
}

// ─── Thumbnail capture from video element ────────────────────────────────────
// Returns a Blob so the parent can upload it to object storage.

function captureThumbnailBlob(
  videoEl: HTMLVideoElement,
): Promise<Blob | undefined> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoEl.videoWidth || 320;
      canvas.height = videoEl.videoHeight || 180;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(undefined);
        return;
      }
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob ?? undefined), "image/jpeg", 0.7);
    } catch {
      resolve(undefined);
    }
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VideoRecorder({
  disabled,
  onSend,
  onCancel,
  onStateChange,
}: VideoRecorderProps) {
  const [camState, setCamState] = useState<CameraState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | undefined>();
  // Local object URL for the preview thumbnail display only (not persisted)
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<
    string | undefined
  >();
  const [finalDuration, setFinalDuration] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const { label: timerLabel, elapsed } = useTimer(camState === "recording");

  const stopStream = useCallback(() => {
    for (const t of streamRef.current?.getTracks() ?? []) t.stop();
    streamRef.current = null;
  }, []);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (thumbnailPreviewUrl) {
      URL.revokeObjectURL(thumbnailPreviewUrl);
      setThumbnailPreviewUrl(undefined);
    }
  }, [thumbnailPreviewUrl]);

  // Open viewfinder on camera button press
  const handleOpenCamera = useCallback(async () => {
    if (disabled) return;
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
      streamRef.current = stream;
      setCamState("viewfinder");
      onStateChange?.(true);
      // Attach stream to video element after render
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => undefined);
        }
      });
    } catch {
      setErrorMsg(
        "Camera access denied. Please allow camera and microphone permissions.",
      );
      setCamState("error");
    }
  }, [disabled, onStateChange]);

  // Attach stream when viewfinder mounts
  useEffect(() => {
    if (
      (camState === "viewfinder" || camState === "recording") &&
      videoRef.current &&
      streamRef.current
    ) {
      if (!videoRef.current.srcObject) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => undefined);
      }
    }
  }, [camState]);

  const handleStartRecording = useCallback(() => {
    if (!streamRef.current) return;

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;

      // Capture thumbnail as a Blob from the current video frame
      const thumb = videoRef.current
        ? await captureThumbnailBlob(videoRef.current)
        : undefined;
      setThumbnailBlob(thumb);
      // Create a local preview URL just for displaying in the UI
      if (thumb) {
        setThumbnailPreviewUrl(URL.createObjectURL(thumb));
      }
      setPreviewBlob(blob);
      stopStream();
      setCamState("preview");
    };

    recorder.start(100);
    setCamState("recording");
  }, [stopStream]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      setFinalDuration(elapsed);
      mediaRecorderRef.current.stop();
    }
  }, [elapsed]);

  const handleSend = useCallback(() => {
    if (!previewBlob) return;
    // Pass thumbnailBlob to parent — parent will upload it to object storage
    onSend(previewBlob, finalDuration, thumbnailBlob);
    revokePreview();
    setPreviewBlob(null);
    setThumbnailBlob(undefined);
    setCamState("idle");
    onStateChange?.(false);
  }, [
    previewBlob,
    finalDuration,
    thumbnailBlob,
    onSend,
    revokePreview,
    onStateChange,
  ]);

  const handleCancel = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    stopStream();
    revokePreview();
    setPreviewBlob(null);
    setThumbnailBlob(undefined);
    setErrorMsg("");
    setCamState("idle");
    onCancel();
    onStateChange?.(false);
  }, [stopStream, revokePreview, onCancel, onStateChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      stopStream();
      revokePreview();
    };
  }, [stopStream, revokePreview]);

  // ── Idle: trigger button only ─────────────────────────────────────────────
  if (camState === "idle") {
    return (
      <button
        type="button"
        onClick={handleOpenCamera}
        disabled={disabled}
        aria-label="Record video message"
        data-ocid="video-record-btn"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors-fast disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
      >
        <Video className="w-4 h-4" />
      </button>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (camState === "error") {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex-1"
        data-ocid="video-record-error"
      >
        <VideoOff className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">{errorMsg}</span>
        <button
          type="button"
          onClick={() => setCamState("idle")}
          aria-label="Dismiss"
          className="text-destructive/70 hover:text-destructive transition-colors-fast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // ── Viewfinder + recording ────────────────────────────────────────────────
  if (camState === "viewfinder" || camState === "recording") {
    return (
      <div
        className="w-full rounded-2xl overflow-hidden border border-border bg-background relative"
        style={{ aspectRatio: "16/9" }}
        data-ocid="video-viewfinder"
      >
        {/* Live preview */}
        {/* biome-ignore lint/a11y/useMediaCaption: live camera viewfinder */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover bg-background"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Controls overlay */}
        <div className="absolute inset-x-0 bottom-0 px-4 py-3 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-3">
          {/* Timer — only when recording */}
          {camState === "recording" && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span
                className="text-xs font-mono text-white/90 tabular-nums"
                data-ocid="video-timer"
              >
                {timerLabel}
              </span>
            </div>
          )}

          <div className="flex-1" />

          {/* Cancel */}
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Cancel video"
            data-ocid="video-cancel-btn"
            className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors-fast"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Start / Stop record */}
          {camState === "viewfinder" ? (
            <button
              type="button"
              onClick={handleStartRecording}
              aria-label="Start recording"
              data-ocid="video-start-record-btn"
              className="w-12 h-12 rounded-full bg-destructive flex items-center justify-center hover:opacity-90 transition-smooth active:scale-95 shadow-lg"
            >
              <span className="w-5 h-5 rounded-full bg-white" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStopRecording}
              aria-label="Stop recording"
              data-ocid="video-stop-record-btn"
              className="w-12 h-12 rounded-full bg-destructive flex items-center justify-center hover:opacity-90 transition-smooth active:scale-95 shadow-lg ring-4 ring-destructive/30 animate-pulse"
            >
              <span className="w-5 h-5 rounded-sm bg-white" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Preview ───────────────────────────────────────────────────────────────
  return (
    <div
      className="w-full rounded-2xl overflow-hidden border border-border bg-background relative"
      style={{ aspectRatio: "16/9" }}
      data-ocid="video-preview-card"
    >
      {/* Thumbnail preview (local only for display, actual thumb is uploaded as blob) */}
      {thumbnailPreviewUrl ? (
        <img
          src={thumbnailPreviewUrl}
          alt="Video preview"
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
      ) : previewUrlRef.current ? (
        // biome-ignore lint/a11y/useMediaCaption: preview of recorded video
        <video
          ref={previewVideoRef}
          src={previewUrlRef.current}
          className="w-full h-full object-cover"
          controls
        />
      ) : null}

      {/* Duration badge */}
      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-mono tabular-nums">
        {String(Math.floor(finalDuration / 60)).padStart(2, "0")}:
        {String(finalDuration % 60).padStart(2, "0")}
      </div>

      {/* Controls overlay */}
      <div className="absolute inset-x-0 bottom-0 px-4 py-3 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-3">
        <p className="text-white/80 text-xs font-display font-medium flex-1">
          Video recorded
        </p>
        {/* Cancel */}
        <button
          type="button"
          onClick={handleCancel}
          aria-label="Discard video"
          data-ocid="video-discard-btn"
          className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors-fast"
        >
          <X className="w-4 h-4" />
        </button>
        {/* Send */}
        <button
          type="button"
          onClick={handleSend}
          aria-label="Send video message"
          data-ocid="video-send-btn"
          className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-primary text-primary-foreground text-xs font-display font-semibold hover:opacity-90 transition-smooth active:scale-95 shadow-lg"
        >
          <Send className="w-3.5 h-3.5" />
          Send
        </button>
      </div>
    </div>
  );
}

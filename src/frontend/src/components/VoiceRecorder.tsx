import { Mic, MicOff, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type RecordingState = "idle" | "recording" | "preview" | "error";

interface VoiceRecorderProps {
  disabled?: boolean;
  onSend: (blob: Blob, durationSecs: number) => void;
  onCancel: () => void;
  onStateChange?: (active: boolean) => void;
}

// ─── Timer hook ───────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export function VoiceRecorder({
  disabled,
  onSend,
  onCancel,
  onStateChange,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [finalDuration, setFinalDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const { label: timerLabel, elapsed } = useTimer(state === "recording");

  const stopStream = useCallback(() => {
    for (const t of streamRef.current?.getTracks() ?? []) t.stop();
    streamRef.current = null;
  }, []);

  const handleStart = useCallback(async () => {
    if (disabled) return;
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setPreviewBlob(blob);
        setState("preview");
        stopStream();
      };

      recorder.start(100);
      setState("recording");
      onStateChange?.(true);
    } catch {
      setErrorMsg(
        "Microphone access denied. Please allow microphone permissions.",
      );
      setState("error");
    }
  }, [disabled, stopStream, onStateChange]);

  const handleStop = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      setFinalDuration(elapsed);
      mediaRecorderRef.current.stop();
    }
  }, [elapsed]);

  const handleSend = useCallback(() => {
    if (!previewBlob) return;
    onSend(previewBlob, finalDuration);
    setPreviewBlob(null);
    setState("idle");
    onStateChange?.(false);
  }, [previewBlob, finalDuration, onSend, onStateChange]);

  const handleCancel = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    stopStream();
    setPreviewBlob(null);
    setErrorMsg("");
    setState("idle");
    onCancel();
    onStateChange?.(false);
  }, [stopStream, onCancel, onStateChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      stopStream();
    };
  }, [stopStream]);

  // ── Idle: just the mic trigger button ──────────────────────────────────────
  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={handleStart}
        disabled={disabled}
        aria-label="Record voice message"
        data-ocid="voice-record-btn"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors-fast disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
      >
        <Mic className="w-4 h-4" />
      </button>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (state === "error") {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex-1"
        data-ocid="voice-record-error"
      >
        <MicOff className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">{errorMsg}</span>
        <button
          type="button"
          onClick={() => setState("idle")}
          aria-label="Dismiss"
          className="text-destructive/70 hover:text-destructive transition-colors-fast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // ── Recording bar ──────────────────────────────────────────────────────────
  if (state === "recording") {
    return (
      <div
        className="flex items-center gap-3 flex-1 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/30"
        data-ocid="voice-recording-bar"
      >
        {/* Pulsing dot */}
        <span className="relative flex h-3 w-3 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
        </span>
        <span className="text-xs font-display font-semibold text-destructive flex-shrink-0">
          Recording…
        </span>
        <span
          className="text-xs font-mono text-destructive/80 flex-shrink-0 tabular-nums"
          data-ocid="voice-timer"
        >
          {timerLabel}
        </span>
        <div className="flex-1" />
        {/* Cancel */}
        <button
          type="button"
          onClick={handleCancel}
          aria-label="Cancel recording"
          data-ocid="voice-cancel-btn"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors-fast flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        {/* Stop / send */}
        <button
          type="button"
          onClick={handleStop}
          aria-label="Stop recording"
          data-ocid="voice-stop-btn"
          className="w-8 h-8 rounded-xl bg-destructive text-destructive-foreground flex items-center justify-center flex-shrink-0 hover:opacity-90 transition-smooth active:scale-95"
        >
          <span className="w-3.5 h-3.5 rounded-sm bg-current" />
        </button>
      </div>
    );
  }

  // ── Preview bar ────────────────────────────────────────────────────────────
  return (
    <div
      className="flex items-center gap-3 flex-1 px-3 py-2 rounded-xl bg-primary/10 border border-primary/30"
      data-ocid="voice-preview-bar"
    >
      <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
        <Mic className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-display font-semibold text-foreground truncate">
          Voice message
        </p>
        <p className="text-[10px] text-muted-foreground font-mono tabular-nums">
          {String(Math.floor(finalDuration / 60)).padStart(2, "0")}:
          {String(finalDuration % 60).padStart(2, "0")}
        </p>
      </div>
      {/* Cancel */}
      <button
        type="button"
        onClick={handleCancel}
        aria-label="Discard recording"
        data-ocid="voice-discard-btn"
        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors-fast flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      {/* Send */}
      <button
        type="button"
        onClick={handleSend}
        aria-label="Send voice message"
        data-ocid="voice-send-btn"
        className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 hover:opacity-90 transition-smooth active:scale-95"
      >
        <Send className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

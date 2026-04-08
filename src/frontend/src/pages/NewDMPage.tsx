import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import { useCreateDirectConversation } from "../hooks/useBackend";

export default function NewDMPage() {
  const navigate = useNavigate();
  const createDM = useCreateDirectConversation();

  const [principalId, setPrincipalId] = useState("");
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isEmpty = principalId.trim().length === 0;
  const showEmptyError = touched && isEmpty;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setServerError(null);
    if (isEmpty) return;

    createDM.mutate(
      { otherUserId: principalId.trim(), displayName: principalId.trim() },
      {
        onSuccess: (conv) => {
          navigate({ to: "/conversations/$id", params: { id: conv.id } });
        },
        onError: () => {
          setServerError("Failed to create conversation. Please try again.");
        },
      },
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Page header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card">
        <button
          type="button"
          onClick={() => navigate({ to: "/conversations" })}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast"
          aria-label="Back to conversations"
          data-ocid="new-dm-back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display font-semibold text-base text-foreground leading-tight">
            New Direct Message
          </h1>
          <p className="text-xs text-muted-foreground">
            Start a private conversation
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col items-center justify-start pt-10 px-6">
        <div className="w-full max-w-md">
          {/* Icon badge */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <MessageSquarePlus className="w-7 h-7 text-primary" />
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Principal ID field */}
            <div className="space-y-1.5">
              <label
                htmlFor="principal-id"
                className="block text-xs font-display font-semibold text-muted-foreground uppercase tracking-wide"
              >
                User Principal ID
              </label>
              <Input
                id="principal-id"
                value={principalId}
                onChange={(e) => {
                  setPrincipalId(e.target.value);
                  setServerError(null);
                }}
                onBlur={() => setTouched(true)}
                placeholder="e.g. rdmx6-jaaaa-aaaaa-aaadq-cai"
                data-ocid="new-dm-principal-input"
                className={`h-11 bg-card font-mono text-sm ${
                  showEmptyError
                    ? "border-destructive focus-visible:ring-destructive"
                    : "border-border"
                }`}
                aria-describedby={
                  showEmptyError ? "principal-error" : undefined
                }
                aria-invalid={showEmptyError}
                autoFocus
              />
              {showEmptyError && (
                <p
                  id="principal-error"
                  role="alert"
                  className="text-xs text-destructive font-display"
                >
                  Principal ID is required
                </p>
              )}
              {serverError && (
                <p
                  role="alert"
                  className="text-xs text-destructive font-display"
                >
                  {serverError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Paste the Internet Computer principal ID of the person you want
                to message.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/conversations" })}
                className="flex-1 h-11 font-display font-semibold"
                data-ocid="new-dm-cancel-btn"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createDM.isPending}
                className="flex-1 h-11 font-display font-semibold"
                data-ocid="new-dm-submit-btn"
              >
                {createDM.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Start Conversation"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import { useState } from "react";
import { useCreateGroupConversation } from "../hooks/useBackend";

function parsePrincipalIds(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function NewGroupPage() {
  const navigate = useNavigate();
  const createGroup = useCreateGroupConversation();

  const [groupName, setGroupName] = useState("");
  const [membersRaw, setMembersRaw] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [membersTouched, setMembersTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const nameEmpty = groupName.trim().length === 0;
  const memberIds = parsePrincipalIds(membersRaw);
  const membersEmpty = memberIds.length === 0;

  const showNameError = nameTouched && nameEmpty;
  const showMembersError = membersTouched && membersEmpty;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNameTouched(true);
    setMembersTouched(true);
    setServerError(null);
    if (nameEmpty || membersEmpty) return;

    createGroup.mutate(
      { name: groupName.trim(), memberIds },
      {
        onSuccess: (conv) => {
          navigate({ to: "/conversations/$id", params: { id: conv.id } });
        },
        onError: () => {
          setServerError("Failed to create group. Please try again.");
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
          data-ocid="new-group-back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display font-semibold text-base text-foreground leading-tight">
            New Group Chat
          </h1>
          <p className="text-xs text-muted-foreground">
            Create a group conversation
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col items-center justify-start pt-10 px-6 overflow-y-auto scrollbar-thin">
        <div className="w-full max-w-md pb-8">
          {/* Icon badge */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Users className="w-7 h-7 text-primary" />
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Group name field */}
            <div className="space-y-1.5">
              <label
                htmlFor="group-name"
                className="block text-xs font-display font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Group Name
              </label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => {
                  setGroupName(e.target.value);
                  setServerError(null);
                }}
                onBlur={() => setNameTouched(true)}
                placeholder="e.g. Protocol Research"
                data-ocid="new-group-name-input"
                className={`h-11 bg-card ${
                  showNameError
                    ? "border-destructive focus-visible:ring-destructive"
                    : "border-border"
                }`}
                aria-describedby={
                  showNameError ? "group-name-error" : undefined
                }
                aria-invalid={showNameError}
                autoFocus
              />
              {showNameError && (
                <p
                  id="group-name-error"
                  role="alert"
                  className="text-xs text-destructive font-display"
                >
                  Group name is required
                </p>
              )}
            </div>

            {/* Members field */}
            <div className="space-y-1.5">
              <label
                htmlFor="group-members"
                className="block text-xs font-display font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Member Principal IDs
                {memberIds.length > 0 && (
                  <span className="ml-2 text-primary normal-case font-normal">
                    — {memberIds.length} member
                    {memberIds.length !== 1 ? "s" : ""}
                  </span>
                )}
              </label>
              <Textarea
                id="group-members"
                value={membersRaw}
                onChange={(e) => {
                  setMembersRaw(e.target.value);
                  setServerError(null);
                }}
                onBlur={() => setMembersTouched(true)}
                placeholder="rdmx6-jaaaa-aaaaa-aaadq-cai, abc12-xyz99-…"
                data-ocid="new-group-members-input"
                rows={4}
                className={`bg-card font-mono text-sm resize-none ${
                  showMembersError
                    ? "border-destructive focus-visible:ring-destructive"
                    : "border-border"
                }`}
                aria-describedby={
                  showMembersError ? "members-error" : "members-hint"
                }
                aria-invalid={showMembersError}
              />
              {showMembersError ? (
                <p
                  id="members-error"
                  role="alert"
                  className="text-xs text-destructive font-display"
                >
                  At least one member principal ID is required
                </p>
              ) : (
                <p id="members-hint" className="text-xs text-muted-foreground">
                  Separate multiple principal IDs with commas.
                </p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <p role="alert" className="text-xs text-destructive font-display">
                {serverError}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/conversations" })}
                className="flex-1 h-11 font-display font-semibold"
                data-ocid="new-group-cancel-btn"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createGroup.isPending}
                className="flex-1 h-11 font-display font-semibold"
                data-ocid="new-group-submit-btn"
              >
                {createGroup.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create Group"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

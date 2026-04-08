import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Calendar, MessageSquare, Users } from "lucide-react";
import { AvatarBubble } from "../components/Sidebar";
import { useAuth } from "../hooks/useAuth";
import {
  useCreateDirectConversation,
  useGetProfile,
  useGetSharedConversations,
} from "../hooks/useBackend";

function formatMemberSince(ts: bigint | undefined): string {
  if (!ts) return "Unknown";
  return new Date(Number(ts)).toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });
}

export default function UserProfilePage() {
  const { userId } = useParams({ from: "/profile/$userId" });
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useGetProfile(userId);
  const { data: sharedConvs = [], isLoading: loadingShared } =
    useGetSharedConversations(userId);
  const createDM = useCreateDirectConversation();

  const isOwnProfile = userId === currentUser?.id || userId === "me";

  const handleMessage = async () => {
    if (!profile) return;
    const conv = await createDM.mutateAsync({
      otherUserId: userId,
      displayName: profile.displayName,
    });
    navigate({ to: "/conversations/$id", params: { id: conv.id } });
  };

  const initials = profile?.avatarInitials ?? userId.slice(0, 2).toUpperCase();
  const profileImageUrl = isOwnProfile
    ? currentUser?.profileImageUrl
    : profile?.profileImageUrl;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0"
        data-ocid="profile-header"
      >
        <button
          type="button"
          onClick={() => navigate({ to: -1 as never })}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast flex-shrink-0"
          aria-label="Go back"
          data-ocid="back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-display font-semibold text-sm text-foreground">
          {isLoading ? "Profile" : (profile?.displayName ?? "User Profile")}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
          {/* ── Profile card ── */}
          <div
            className="rounded-2xl bg-card border border-border p-6 flex flex-col items-center gap-4"
            data-ocid="profile-card"
          >
            {isLoading ? (
              <>
                <Skeleton className="w-20 h-20 rounded-full" />
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : profile ? (
              <>
                {/* Large avatar */}
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={profile.displayName}
                    className="w-20 h-20 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/20 text-primary flex items-center justify-center font-display font-bold text-2xl select-none">
                    {initials}
                  </div>
                )}

                {/* Name + handle */}
                <div className="text-center">
                  <h2 className="font-display font-bold text-xl text-foreground">
                    {profile.displayName}
                  </h2>
                  {profile.usernameHandle ? (
                    <p className="text-sm text-primary mt-0.5 font-mono">
                      @{profile.usernameHandle}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-0.5 font-mono">
                      @{userId.slice(0, 12)}
                    </p>
                  )}
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-sm text-muted-foreground text-center max-w-xs leading-relaxed">
                    {profile.bio}
                  </p>
                )}

                {/* Member since */}
                <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Member since{" "}
                    <span className="text-foreground font-medium">
                      {formatMemberSince(profile.memberSince)}
                    </span>
                  </span>
                </div>

                {/* Message button — hidden for own profile */}
                {!isOwnProfile && (
                  <Button
                    onClick={handleMessage}
                    disabled={createDM.isPending}
                    data-ocid="message-user-btn"
                    className="gap-2 mt-1"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {createDM.isPending ? "Opening chat…" : "Message"}
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground font-display">
                  User not found
                </p>
              </div>
            )}
          </div>

          {/* ── Shared conversations ── */}
          {!isOwnProfile && (
            <div data-ocid="shared-conversations-section">
              <h3 className="font-display font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary/70" />
                Shared groups
              </h3>

              {loadingShared ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl bg-card border border-border px-4 py-3"
                    >
                      <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sharedConvs.length === 0 ? (
                <div
                  className="rounded-xl bg-card border border-border px-4 py-6 flex flex-col items-center text-center"
                  data-ocid="no-shared-groups"
                >
                  <Users className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-[13px] text-muted-foreground">
                    No shared groups
                  </p>
                  <p className="text-[13px] text-muted-foreground/60 mt-1">
                    You and this user aren't in any groups together
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sharedConvs.map((conv) => {
                    const convInitials = conv.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <Link
                        key={conv.id}
                        to="/conversations/$id"
                        params={{ id: conv.id }}
                        data-ocid={`shared-conv-${conv.id}`}
                        className="flex items-center gap-3 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-primary/5 px-4 py-3 transition-colors-fast"
                      >
                        <AvatarBubble initials={convInitials} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-semibold text-sm text-foreground truncate">
                            {conv.name}
                          </p>
                          <p className="text-[13px] text-muted-foreground">
                            {conv.memberIds.length} members
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

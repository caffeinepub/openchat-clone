import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useCallback, useEffect, useState } from "react";
import type { UserProfile } from "../types";

function principalToInitials(principal: string): string {
  const parts = principal.split("-");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return principal.slice(0, 2).toUpperCase();
}

function principalToDisplayName(principal: string): string {
  const parts = principal.split("-");
  return parts.length >= 2
    ? `${parts[0]}-${parts[1]}`.toLowerCase()
    : principal.slice(0, 10);
}

export function useAuth() {
  const { identity, loginStatus, login, clear } = useInternetIdentity();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // "success" covers a fresh login; "idle" with a non-null identity covers a
  // restored session loaded from localStorage on page refresh.
  const isAuthenticated =
    identity != null && !identity.getPrincipal().isAnonymous();
  const isLoading =
    loginStatus === "logging-in" || loginStatus === "initializing";

  useEffect(() => {
    if (isAuthenticated && identity) {
      const principal = identity.getPrincipal().toText();
      setCurrentUser((prev) => {
        // Only reset to defaults if this is a new login (different principal)
        if (prev && prev.id === principal) return prev;
        return {
          id: principal,
          displayName: principalToDisplayName(principal),
          avatarInitials: principalToInitials(principal),
        };
      });
    } else if (!isAuthenticated) {
      setCurrentUser(null);
    }
  }, [isAuthenticated, identity]);

  const logout = useCallback(() => {
    clear();
    setCurrentUser(null);
  }, [clear]);

  /**
   * Merge updated profile fields into the current user state.
   * Call this after a successful updateProfile backend call.
   */
  const updateCurrentUser = useCallback((updates: Partial<UserProfile>) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const newInitials = updates.displayName
        ? updates.displayName
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : prev.avatarInitials;
      return {
        ...prev,
        ...updates,
        avatarInitials: newInitials,
      };
    });
  }, []);

  return {
    isAuthenticated,
    isLoading,
    currentUser,
    login,
    logout,
    updateCurrentUser,
  };
}

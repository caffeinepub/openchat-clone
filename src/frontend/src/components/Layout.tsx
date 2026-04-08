import { Outlet, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import Sidebar from "./Sidebar";

export default function Layout() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: "/conversations" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-body">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 max-w-sm w-full px-6">
          {/* Logo mark */}
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              role="img"
              aria-label="OpenChat logo"
            >
              <path
                d="M6 8C6 6.9 6.9 6 8 6h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H10l-4 4V8z"
                fill="oklch(0.65 0.26 193)"
              />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-semibold text-foreground mb-1">
              OpenChat
            </h1>
            <p className="text-muted-foreground text-sm">
              Decentralized messaging on the Internet Computer
            </p>
          </div>
          <button
            type="button"
            data-ocid="login-btn"
            onClick={login}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm transition-smooth hover:opacity-90 active:scale-[0.98]"
          >
            Sign in with Internet Identity
          </button>
          <p className="text-xs text-muted-foreground text-center">
            Your identity, your data. No accounts, no passwords.
          </p>
        </div>
      </div>
    );
  }

  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 bg-background">
          <Outlet />
        </main>
      </div>
      <footer className="flex-shrink-0 flex items-center justify-center py-1.5 bg-card border-t border-border">
        <p className="text-[10px] text-muted-foreground/50 select-none">
          © {year}.{" "}
          <a
            href={caffeineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground transition-colors duration-200"
          >
            Built with love using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

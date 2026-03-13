"use client";

import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BookOpen, LogIn, User, Scissors } from "lucide-react";
import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";

export function Header() {
  const { user, isAnonymous, signInWithGoogle } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut(getFirebaseAuth());
    setMenuOpen(false);
  };

  return (
    <header
      className="
        sticky top-0 z-40
        border-b border-[var(--border)]
        bg-[var(--bg-card)]/90 backdrop-blur-md
        transition-colors duration-200
      "
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">

        {/* ── Logo ── */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-[var(--primary)] hover:opacity-80 transition-opacity"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)] shadow-sm">
            <Scissors className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm tracking-wide">CrochetAI</span>
        </Link>

        {/* ── Nav + Controls ── */}
        <div className="flex items-center gap-1">

          {/* My Patterns link (signed-in users only) */}
          {!isAnonymous && (
            <Link
              href="/patterns"
              className="
                flex items-center gap-1.5 rounded-lg px-3 py-2
                text-sm text-[var(--text-muted)] transition-colors
                hover:bg-[var(--bg-muted)] hover:text-[var(--text)]
              "
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">My Patterns</span>
            </Link>
          )}

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Auth */}
          <div className="ml-1">
            {isAnonymous ? (
              <Button variant="outline" size="sm" onClick={signInWithGoogle}>
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign in</span>
              </Button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="
                    flex items-center gap-1.5 rounded-lg border
                    border-[var(--border)] bg-[var(--bg-card)]
                    px-3 py-1.5 text-sm text-[var(--text)]
                    hover:bg-[var(--bg-muted)] transition-colors
                  "
                >
                  <User className="h-3.5 w-3.5 text-[var(--primary)]" />
                  <span className="hidden sm:inline max-w-[120px] truncate">
                    {user?.displayName ?? user?.email ?? "Account"}
                  </span>
                </button>

                {menuOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div
                      className="
                        absolute right-0 top-full z-20 mt-1.5 w-44
                        rounded-xl border border-[var(--border)]
                        bg-[var(--bg-card)] shadow-lg overflow-hidden
                      "
                    >
                      <Link
                        href="/patterns"
                        onClick={() => setMenuOpen(false)}
                        className="
                          flex items-center gap-2 w-full px-4 py-2.5
                          text-sm text-[var(--text)] hover:bg-[var(--bg-muted)]
                          transition-colors sm:hidden
                        "
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        My Patterns
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="
                          w-full px-4 py-2.5 text-left text-sm
                          text-[var(--text-muted)] hover:bg-[var(--bg-muted)]
                          hover:text-[var(--text)] transition-colors
                        "
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

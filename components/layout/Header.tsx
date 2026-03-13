"use client";

import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Scissors, BookOpen, LogIn, User } from "lucide-react";
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
    <header className="sticky top-0 z-40 border-b border-rose-100 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-rose-600">
          <Scissors className="h-5 w-5" />
          <span>CrochetAI</span>
        </Link>

        {/* Nav + Auth */}
        <div className="flex items-center gap-3">
          {!isAnonymous && (
            <Link
              href="/patterns"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-rose-600 transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              My Patterns
            </Link>
          )}

          {isAnonymous ? (
            <Button variant="outline" size="sm" onClick={signInWithGoogle}>
              <LogIn className="h-3.5 w-3.5" />
              Sign in
            </Button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-1.5 rounded-full border border-rose-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-rose-50"
              >
                <User className="h-3.5 w-3.5 text-rose-400" />
                <span className="max-w-[120px] truncate">
                  {user?.displayName ?? user?.email ?? "Account"}
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-gray-100 bg-white shadow-lg">
                  <button
                    onClick={handleSignOut}
                    className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-rose-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

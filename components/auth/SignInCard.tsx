"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { SignInButton } from "./SignInButton";
import { User } from "lucide-react";

interface SignInCardProps {
  className?: string;
}

export function SignInCard({ className = "" }: SignInCardProps) {
  const { isAnonymous } = useAuth();

  // Don't show if already signed in
  if (!isAnonymous) return null;

  return (
    <div 
      className={`
        rounded-xl border border-[var(--border)]
        bg-[var(--bg-card)] p-6
        shadow-sm
        ${className}
      `}
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-muted)]">
          <User className="h-6 w-6 text-[var(--primary)]" />
        </div>
        
        <div className="space-y-1">
          <h3 className="font-semibold text-[var(--text)]">Sign in to save patterns</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Sign in with Google to access your pattern library across devices
          </p>
        </div>

        <SignInButton size="md" />
      </div>
    </div>
  );
}

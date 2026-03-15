"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { EmailSignInForm } from "./EmailSignInForm";

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
      <EmailSignInForm />
    </div>
  );
}

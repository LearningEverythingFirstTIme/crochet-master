"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { LogIn } from "lucide-react";

interface SignInButtonProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export function SignInButton({ 
  className = "", 
  size = "md",
  fullWidth = false 
}: SignInButtonProps) {
  const { signInWithGoogle, isAnonymous } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Don't show if already signed in with Google
  if (!isAnonymous) return null;

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Sign in failed:", err);
      alert("Sign in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5"
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        inline-flex items-center justify-center
        rounded-lg border border-[var(--border)]
        bg-[var(--bg-card)] text-[var(--text)]
        hover:bg-[var(--bg-muted)]
        active:scale-[0.98]
        transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {isLoading ? (
        <span className="animate-pulse">Connecting...</span>
      ) : (
        <>
          <LogIn className={iconSizes[size]} />
          <span>Sign in with Google</span>
        </>
      )}
    </button>
  );
}

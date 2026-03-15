"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle, Check } from "lucide-react";

interface EmailSignInFormProps {
  className?: string;
  onSuccess?: () => void;
}

export function EmailSignInForm({ className = "", onSuccess }: EmailSignInFormProps) {
  const { signInWithEmail, signUpWithEmail, isAnonymous } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Don't show if already signed in
  if (!isAnonymous) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (mode === "signup" && formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      if (mode === "signin") {
        await signInWithEmail(formData.email, formData.password);
      } else {
        await signUpWithEmail(formData.email, formData.password);
      }
      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Email already registered. Try signing in instead.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address");
      } else {
        setError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <p className="font-medium text-[var(--text)]">Success!</p>
        <p className="text-sm text-[var(--text-muted)]">You're now signed in.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="text-center mb-4">
        <h3 className="font-semibold text-[var(--text)]">
          {mode === "signin" ? "Sign In" : "Create Account"}
        </h3>
        <p className="text-sm text-[var(--text-muted)]">
          {mode === "signin" 
            ? "Welcome back! Sign in to access your patterns."
            : "Create an account to save your patterns."}
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text)]">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="you@example.com"
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-2 pl-10 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text)]">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            required
            minLength={6}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-2 pl-10 pr-10 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mode === "signup" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text)]">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-2 pl-10 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="animate-pulse">{mode === "signin" ? "Signing in..." : "Creating account..."}</span>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            <span>{mode === "signin" ? "Sign In" : "Create Account"}</span>
          </>
        )}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
          className="text-sm text-[var(--primary)] hover:underline"
        >
          {mode === "signin" 
            ? "Don't have an account? Create one"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </form>
  );
}

"use client";

import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  linkWithPopup,
  linkWithRedirect,
  onAuthStateChanged,
  type User,
  type AuthError,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  getIdToken: () => Promise<string>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

// Detect if user is on a mobile device
function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Get human-readable error message
function getAuthErrorMessage(err: AuthError | Error | unknown): string {
  const code = (err as AuthError)?.code || "";
  const message = (err as Error)?.message || "";
  
  switch (code) {
    case "auth/unauthorized-domain":
      return "This domain is not authorized for sign-in. Please contact support.";
    case "auth/popup-blocked":
      return "Sign-in popup was blocked. Please allow popups and try again.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method.";
    case "auth/invalid-credential":
      return "Sign-in failed. Please try again.";
    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled. Please contact support.";
    case "auth/redirect-cancelled-by-user":
      return "Sign-in was cancelled.";
    case "auth/redirect-operation-pending":
      return "Sign-in already in progress.";
    default:
      return message || "Sign-in failed. Please try again.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [redirectHandled, setRedirectHandled] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    let unsubscribe: (() => void) | null = null;

    // Handle redirect result first (for mobile sign-in)
    // This must complete before setting up onAuthStateChanged to avoid race conditions
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("[Auth] Redirect sign-in successful:", result.user.uid);
          setUser(result.user);
        } else {
          console.log("[Auth] No redirect result");
        }
      })
      .catch((err) => {
        console.error("[Auth] Redirect sign-in error:", err);
        setAuthError(getAuthErrorMessage(err));
      })
      .finally(() => {
        setRedirectHandled(true);
        // Now set up the auth state listener
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            console.log("[Auth] User state changed:", firebaseUser.uid, "Anonymous:", firebaseUser.isAnonymous);
            setUser(firebaseUser);
            setLoading(false);
          } else {
            console.log("[Auth] No user, signing in anonymously");
            // Sign in anonymously on first visit
            try {
              const result = await signInAnonymously(auth);
              setUser(result.user);
            } catch (err) {
              console.error("[Auth] Anonymous sign-in failed:", err);
              setAuthError(getAuthErrorMessage(err));
            } finally {
              setLoading(false);
            }
          }
        });
      });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    const isMobile = isMobileDevice();

    console.log("[Auth] Starting Google sign-in, mobile:", isMobile);
    setAuthError(null);

    try {
      if (user?.isAnonymous) {
        // Upgrade anonymous account to Google account, preserving data
        try {
          if (isMobile) {
            console.log("[Auth] Using linkWithRedirect for mobile");
            await linkWithRedirect(user, provider);
            // Page will redirect, no need to set user
          } else {
            console.log("[Auth] Using linkWithPopup for desktop");
            const result = await linkWithPopup(user, provider);
            console.log("[Auth] Popup link successful:", result.user.uid);
            setUser(result.user);
          }
        } catch (err: unknown) {
          const errorCode = (err as AuthError)?.code;
          console.log("[Auth] Link error:", errorCode);
          
          // If account already exists, sign in normally
          if (errorCode === "auth/credential-already-in-use") {
            console.log("[Auth] Account exists, signing in normally");
            if (isMobile) {
              await signInWithRedirect(auth, provider);
            } else {
              const result = await signInWithPopup(auth, provider);
              setUser(result.user);
            }
          } else if (errorCode === "auth/operation-not-supported-in-this-environment") {
            console.log("[Auth] Popup not supported, falling back to redirect");
            // Fallback to redirect if popup fails
            await signInWithRedirect(auth, provider);
          } else {
            throw err;
          }
        }
      } else {
        // Not anonymous - regular sign in
        if (isMobile) {
          console.log("[Auth] Using signInWithRedirect for mobile");
          await signInWithRedirect(auth, provider);
        } else {
          console.log("[Auth] Using signInWithPopup for desktop");
          const result = await signInWithPopup(auth, provider);
          console.log("[Auth] Popup sign-in successful:", result.user.uid);
          setUser(result.user);
        }
      }
    } catch (err) {
      console.error("[Auth] Sign-in error:", err);
      setAuthError(getAuthErrorMessage(err));
      throw err;
    }
  };

  const getIdToken = async (): Promise<string> => {
    if (!user) throw new Error("Not authenticated");
    return user.getIdToken();
  };

  const clearError = () => setAuthError(null);

  // Don't render children until we've handled any redirect result
  if (!redirectHandled) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAnonymous: user?.isAnonymous ?? true,
        authError,
        signInWithGoogle,
        getIdToken,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

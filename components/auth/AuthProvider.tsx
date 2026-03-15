"use client";

import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
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
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

// Get human-readable error message
function getAuthErrorMessage(err: AuthError | Error | unknown): string {
  const code = (err as AuthError)?.code || "";
  const message = (err as Error)?.message || "";
  
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/email-already-in-use":
      return "An account already exists with this email.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    default:
      return message || "Authentication failed. Please try again.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    console.log("[Auth] Initializing...");

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("[Auth] User signed in:", firebaseUser.uid, "Anonymous:", firebaseUser.isAnonymous);
        setUser(firebaseUser);
        setLoading(false);
      } else {
        console.log("[Auth] No user, creating anonymous session...");
        // Sign in anonymously on first visit
        try {
          const result = await signInAnonymously(auth);
          console.log("[Auth] Anonymous session created:", result.user.uid);
          setUser(result.user);
        } catch (err) {
          console.error("[Auth] Anonymous sign-in failed:", err);
          setAuthError(getAuthErrorMessage(err));
        } finally {
          setLoading(false);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    console.log("[Auth] Signing in with email...");
    setAuthError(null);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("[Auth] Email sign-in successful:", result.user.uid);
      setUser(result.user);
    } catch (err) {
      console.error("[Auth] Email sign-in error:", err);
      setAuthError(getAuthErrorMessage(err));
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    console.log("[Auth] Creating account with email...");
    setAuthError(null);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log("[Auth] Account created:", result.user.uid);
      setUser(result.user);
    } catch (err) {
      console.error("[Auth] Sign-up error:", err);
      setAuthError(getAuthErrorMessage(err));
      throw err;
    }
  };

  const logout = async () => {
    const auth = getFirebaseAuth();
    console.log("[Auth] Signing out...");
    
    try {
      await signOut(auth);
      console.log("[Auth] Signed out");
      // Anonymous sign-in will trigger automatically via onAuthStateChanged
    } catch (err) {
      console.error("[Auth] Sign-out error:", err);
      setAuthError(getAuthErrorMessage(err));
      throw err;
    }
  };

  const getIdToken = async (): Promise<string> => {
    if (!user) throw new Error("Not authenticated");
    return user.getIdToken();
  };

  const clearError = () => setAuthError(null);

  if (loading) {
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
        signInWithEmail,
        signUpWithEmail,
        logout,
        getIdToken,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

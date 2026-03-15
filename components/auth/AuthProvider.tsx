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
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  signInWithGoogle: () => Promise<void>;
  getIdToken: () => Promise<string>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

// Detect if user is on a mobile device
function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();

    // Handle redirect result first (for mobile sign-in)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
        }
      })
      .catch((err) => {
        console.error("Redirect sign-in error:", err);
      })
      .finally(() => {
        setLoading(false);
      });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setLoading(false);
      } else {
        // Sign in anonymously on first visit
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.error("Anonymous sign-in failed:", err);
          setLoading(false);
        }
      }
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    const isMobile = isMobileDevice();

    if (user?.isAnonymous) {
      // Upgrade anonymous account to Google account, preserving data
      try {
        if (isMobile) {
          // Use redirect for mobile
          await linkWithRedirect(user, provider);
          // Page will redirect, no need to set user
        } else {
          // Use popup for desktop
          const result = await linkWithPopup(user, provider);
          setUser(result.user);
        }
      } catch (err: unknown) {
        const errorCode = (err as { code?: string }).code;
        // If account already exists, sign in normally
        if (errorCode === "auth/credential-already-in-use") {
          if (isMobile) {
            await signInWithRedirect(auth, provider);
          } else {
            const result = await signInWithPopup(auth, provider);
            setUser(result.user);
          }
        } else if (errorCode === "auth/operation-not-supported-in-this-environment") {
          // Fallback to redirect if popup fails
          await signInWithRedirect(auth, provider);
        } else {
          throw err;
        }
      }
    } else {
      // Not anonymous - regular sign in
      if (isMobile) {
        await signInWithRedirect(auth, provider);
      } else {
        const result = await signInWithPopup(auth, provider);
        setUser(result.user);
      }
    }
  };

  const getIdToken = async (): Promise<string> => {
    if (!user) throw new Error("Not authenticated");
    return user.getIdToken();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAnonymous: user?.isAnonymous ?? true,
        signInWithGoogle,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

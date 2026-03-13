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
  GoogleAuthProvider,
  linkWithPopup,
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();

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

    if (user?.isAnonymous) {
      // Upgrade anonymous account to Google account, preserving data
      try {
        const result = await linkWithPopup(user, provider);
        setUser(result.user);
      } catch (err: unknown) {
        // If account already exists, sign in normally
        if (
          err instanceof Error &&
          "code" in err &&
          (err as { code: string }).code === "auth/credential-already-in-use"
        ) {
          const result = await signInWithPopup(auth, provider);
          setUser(result.user);
        } else {
          throw err;
        }
      }
    } else {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
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

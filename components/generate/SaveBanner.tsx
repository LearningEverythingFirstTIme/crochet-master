"use client";

import { useState } from "react";
import { Bookmark, LogIn, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SaveBannerProps {
  patternId: string;
  isAnonymous: boolean;
  onSave: (patternId: string) => Promise<void>;
  onSignIn: () => Promise<void>;
}

export function SaveBanner({ patternId, isAnonymous, onSave, onSignIn }: SaveBannerProps) {
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  const handleSave = async () => {
    if (isAnonymous) {
      await onSignIn();
      return;
    }
    setState("saving");
    try {
      await onSave(patternId);
      setState("saved");
    } catch {
      setState("idle");
    }
  };

  if (state === "saved") {
    return (
      <div
        className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
        style={{
          backgroundColor: "var(--success-bg)",
          borderColor: "var(--success-border)",
          color: "var(--success)",
        }}
      >
        <Check className="h-4 w-4" />
        <span className="font-medium">Pattern saved!</span>
        <span>You can find it in My Patterns.</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3"
      style={{
        backgroundColor: "var(--primary-muted)",
        borderColor: "var(--primary)",
      }}
    >
      <div
        className="flex items-center gap-2 text-sm"
        style={{ color: "var(--primary)" }}
      >
        <Bookmark className="h-4 w-4 flex-shrink-0" />
        <span>
          {isAnonymous
            ? "Sign in to save this pattern to your library."
            : "Save this pattern to your library."}
        </span>
      </div>
      <Button
        onClick={handleSave}
        disabled={state === "saving"}
        size="sm"
        variant="default"
        className="flex-shrink-0"
      >
        {state === "saving" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isAnonymous ? (
          <>
            <LogIn className="h-3.5 w-3.5" />
            Sign in to save
          </>
        ) : (
          <>
            <Bookmark className="h-3.5 w-3.5" />
            Save pattern
          </>
        )}
      </Button>
    </div>
  );
}

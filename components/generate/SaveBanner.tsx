"use client";

import { useState } from "react";
import { Bookmark, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GenerateRequest } from "@/lib/types/pattern";

interface SaveBannerProps {
  patternText: string;
  input: GenerateRequest;
  getIdToken: () => Promise<string>;
  onSaved?: (patternId: string) => void;
}

export function SaveBanner({ patternText, input, getIdToken, onSaved }: SaveBannerProps) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (!patternText.trim()) return;

    setState("saving");
    setErrorMessage(null);

    try {
      const token = await getIdToken();
      const response = await fetch("/api/patterns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: input.description?.slice(0, 100),
          description: input.description,
          rawMarkdown: patternText,
          sourceType: input.image ? "image" : "text",
          sourceImageUrl: null,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: "Save failed" }));
        throw new Error(err.message);
      }

      const pattern = await response.json();
      setState("saved");
      onSaved?.(pattern.id);
    } catch (err) {
      console.error("Save failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Save failed");
      setState("error");
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
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--primary)" }}>
          {input.description?.slice(0, 60) || "Generated Pattern"}
          {input.description && input.description.length > 60 ? "…" : ""}
        </p>
        {errorMessage && (
          <p className="text-xs mt-1" style={{ color: "var(--error)" }}>
            {errorMessage}
          </p>
        )}
      </div>

      <Button
        onClick={handleSave}
        disabled={state === "saving" || !patternText.trim()}
        size="sm"
        variant="default"
        className="flex-shrink-0"
      >
        {state === "saving" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            <Bookmark className="h-3.5 w-3.5 mr-1" />
            Save pattern
          </>
        )}
      </Button>
    </div>
  );
}

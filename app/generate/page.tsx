"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { InputForm } from "@/components/generate/InputForm";
import { PatternStream } from "@/components/generate/PatternStream";
import { SaveBanner } from "@/components/generate/SaveBanner";
import { SignInCard } from "@/components/auth/SignInCard";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePatternStream } from "@/lib/hooks/usePatternStream";
import type { GenerateRequest } from "@/lib/types/pattern";
import { Wand2 } from "lucide-react";

export default function GeneratePage() {
  const router = useRouter();
  const { getIdToken, isAnonymous } = useAuth();
  const { patternText, isStreaming, error, generate } = usePatternStream(getIdToken);
  
  // Track the input used for generation (needed for save)
  const [lastInput, setLastInput] = useState<GenerateRequest | null>(null);

  const handleSubmit = useCallback(
    (input: GenerateRequest) => {
      setLastInput(input);
      generate(input);
    },
    [generate]
  );

  const showSaveBanner = patternText.length > 0 && !isStreaming && !error && lastInput;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <Header />

      <div className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 space-y-5">
        {/* Page title */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: "var(--primary-muted)" }}
          >
            <Wand2 className="h-4 w-4" style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--text)", fontFamily: "var(--font-playfair)" }}
            >
              Generate a Pattern
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Describe your project or upload a photo
            </p>
          </div>
        </div>

        {/* Input form */}
        <div
          className="rounded-2xl border p-6 shadow-sm"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border)",
          }}
        >
          <InputForm onSubmit={handleSubmit} isLoading={isStreaming} />
        </div>

        {/* Sign in prompt for anonymous users */}
        {isAnonymous && !patternText && (
          <SignInCard />
        )}

        {/* Save banner */}
        {showSaveBanner && (
          <SaveBanner
            patternText={patternText}
            input={lastInput!}
            getIdToken={getIdToken}
            onSaved={() => router.push("/patterns")}
          />
        )}

        {/* Streaming pattern output */}
        <PatternStream
          text={patternText}
          isStreaming={isStreaming}
          error={error}
        />
      </div>
    </div>
  );
}

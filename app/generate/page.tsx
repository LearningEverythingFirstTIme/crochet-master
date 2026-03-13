"use client";

import { useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { InputForm } from "@/components/generate/InputForm";
import { PatternStream } from "@/components/generate/PatternStream";
import { SaveBanner } from "@/components/generate/SaveBanner";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePatternStream } from "@/lib/hooks/usePatternStream";
import type { GenerateRequest } from "@/lib/types/pattern";

export default function GeneratePage() {
  const { getIdToken, isAnonymous, signInWithGoogle } = useAuth();
  const { patternText, patternId, isStreaming, error, generate } =
    usePatternStream(getIdToken);

  const handleSubmit = useCallback(
    (input: GenerateRequest) => {
      generate(input);
    },
    [generate]
  );

  const handleSave = useCallback(
    async (id: string) => {
      const token = await getIdToken();
      const res = await fetch("/api/patterns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ patternId: id }),
      });
      if (!res.ok) throw new Error("Failed to save pattern");
    },
    [getIdToken]
  );

  const showSaveBanner = patternText.length > 0 && !isStreaming && !error;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generate a Pattern</h1>
          <p className="text-sm text-gray-500 mt-1">
            Describe your project or upload a photo to get a complete crochet
            pattern.
          </p>
        </div>

        {/* Input form */}
        <div className="rounded-2xl bg-white border border-rose-100 shadow-sm p-6">
          <InputForm onSubmit={handleSubmit} isLoading={isStreaming} />
        </div>

        {/* Save banner (shown after successful generation) */}
        {showSaveBanner && patternId && (
          <SaveBanner
            patternId={patternId}
            isAnonymous={isAnonymous}
            onSave={handleSave}
            onSignIn={signInWithGoogle}
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

"use client";

import { useState, useCallback } from "react";
import type { GenerateRequest } from "@/lib/types/pattern";

interface StreamState {
  patternText: string;
  isStreaming: boolean;
  error: string | null;
}

export function usePatternStream(getIdToken: () => Promise<string>) {
  const [state, setState] = useState<StreamState>({
    patternText: "",
    isStreaming: false,
    error: null,
  });

  const generate = useCallback(
    async (input: GenerateRequest) => {
      setState({ patternText: "", isStreaming: true, error: null });

      try {
        const token = await getIdToken();

        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          let errorMessage = "Failed to generate pattern";
          try {
            const contentType = response.headers.get("content-type");
            if (contentType?.includes("application/json")) {
              const errData = await response.json();
              errorMessage = errData.message ?? errorMessage;
            } else {
              errorMessage = await response.text() || errorMessage;
            }
          } catch {
            // If reading fails, use default message
          }
          setState((s) => ({ ...s, isStreaming: false, error: errorMessage }));
          return;
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;
          setState((s) => ({ ...s, patternText: accumulatedText }));
        }

        setState((s) => ({ ...s, isStreaming: false }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        setState((s) => ({ ...s, isStreaming: false, error: message }));
      }
    },
    [getIdToken]
  );

  const reset = useCallback(() => {
    setState({ patternText: "", isStreaming: false, error: null });
  }, []);

  return { ...state, generate, reset };
}

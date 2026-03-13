"use client";

import { useState, useCallback } from "react";
import type { GenerateRequest } from "@/lib/types/pattern";

interface StreamState {
  patternText: string;
  patternId: string | null;
  isStreaming: boolean;
  error: string | null;
}

export function usePatternStream(getIdToken: () => Promise<string>) {
  const [state, setState] = useState<StreamState>({
    patternText: "",
    patternId: null,
    isStreaming: false,
    error: null,
  });

  const generate = useCallback(
    async (input: GenerateRequest) => {
      setState({ patternText: "", patternId: null, isStreaming: true, error: null });

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
            const errData = await response.json();
            errorMessage = errData.message ?? errorMessage;
          } catch {
            errorMessage = await response.text() || errorMessage;
          }
          setState((s) => ({ ...s, isStreaming: false, error: errorMessage }));
          return;
        }

        const patternId = response.headers.get("X-Pattern-Id");
        setState((s) => ({ ...s, patternId }));

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setState((s) => ({ ...s, patternText: s.patternText + chunk }));
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
    setState({ patternText: "", patternId: null, isStreaming: false, error: null });
  }, []);

  return { ...state, generate, reset };
}

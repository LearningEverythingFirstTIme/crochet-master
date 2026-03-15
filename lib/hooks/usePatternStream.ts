"use client";

import { useState, useCallback } from "react";
import type { GenerateRequest } from "@/lib/types/pattern";

interface StreamState {
  patternText: string;
  patternId: string | null;
  isStreaming: boolean;
  isContinuing: boolean;
  error: string | null;
}

export function usePatternStream(getIdToken: () => Promise<string>) {
  const [state, setState] = useState<StreamState>({
    patternText: "",
    patternId: null,
    isStreaming: false,
    isContinuing: false,
    error: null,
  });

  const checkAndContinue = useCallback(async (
    currentText: string,
    patternId: string,
    attempt: number = 1
  ): Promise<string> => {
    // Check if pattern is complete
    const isComplete = currentText.includes("**END OF PATTERN**") ||
                       currentText.trim().endsWith("**END OF PATTERN**");
    
    if (isComplete) {
      console.log("[usePatternStream] Pattern complete - END marker found");
      return currentText;
    }

    if (attempt > 3) {
      console.log("[usePatternStream] Max continuation attempts reached");
      return currentText;
    }

    console.log(`[usePatternStream] Pattern incomplete, continuing... (attempt ${attempt})`);
    setState((s) => ({ ...s, isContinuing: true }));

    try {
      const token = await getIdToken();
      const response = await fetch("/api/generate/continue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ partialContent: currentText, attempt }),
      });

      if (!response.ok) {
        console.error("[usePatternStream] Continue request failed:", response.status);
        return currentText;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let newContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        newContent += chunk;
        setState((s) => ({ ...s, patternText: currentText + newContent }));
      }

      const combinedText = currentText + newContent;
      
      // Recursively check if we need to continue again
      return checkAndContinue(combinedText, patternId, attempt + 1);
    } catch (err) {
      console.error("[usePatternStream] Continue error:", err);
      return currentText;
    } finally {
      setState((s) => ({ ...s, isContinuing: false }));
    }
  }, [getIdToken]);

  const generate = useCallback(
    async (input: GenerateRequest) => {
      setState({ patternText: "", patternId: null, isStreaming: true, isContinuing: false, error: null });

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
        let receivedLength = 0;
        let accumulatedText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log(`[usePatternStream] Stream complete: ${receivedLength} bytes received`);
            break;
          }
          receivedLength += value?.length || 0;
          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;
          setState((s) => ({ ...s, patternText: accumulatedText }));
        }

        // Check if pattern is complete, auto-continue if needed
        if (patternId) {
          accumulatedText = await checkAndContinue(accumulatedText, patternId, 1);
        }

        setState((s) => ({ ...s, isStreaming: false }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        setState((s) => ({ ...s, isStreaming: false, error: message }));
      }
    },
    [getIdToken, checkAndContinue]
  );

  const reset = useCallback(() => {
    setState({ patternText: "", patternId: null, isStreaming: false, isContinuing: false, error: null });
  }, []);

  return { ...state, generate, reset };
}

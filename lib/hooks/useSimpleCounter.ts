"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "./useAuth";
import type { RowProgress } from "../types/pattern";

interface UseSimpleCounterProps {
  patternId: string;
  initialProgress?: RowProgress;
}

interface UseSimpleCounterReturn {
  currentRow: number;
  totalRows: number;
  isComplete: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  hasStarted: boolean;
  increment: () => void;
  decrement: () => void;
  setRow: (row: number) => void;
  setTotal: (total: number) => void;
  toggleExpanded: () => void;
  startCounter: (totalRows: number) => void;
  markComplete: () => void;
  reset: () => void;
}

export function useSimpleCounter({
  patternId,
  initialProgress,
}: UseSimpleCounterProps): UseSimpleCounterReturn {
  const { getIdToken } = useAuth();
  
  const [currentRow, setCurrentRow] = useState(initialProgress?.currentRow ?? 0);
  const [totalRows, setTotalRows] = useState(initialProgress?.totalRows ?? 0);
  const [isComplete, setIsComplete] = useState(initialProgress?.isComplete ?? false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const hasStarted = totalRows > 0;
  
  // Debounce ref for saving
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingProgressRef = useRef<Partial<RowProgress> | null>(null);

  // Sync with initialProgress when it changes (e.g., after fetching pattern)
  useEffect(() => {
    if (initialProgress) {
      setCurrentRow(initialProgress.currentRow);
      setTotalRows(initialProgress.totalRows);
      setIsComplete(initialProgress.isComplete);
    }
  }, [initialProgress?.currentRow, initialProgress?.totalRows, initialProgress?.isComplete]);

  const saveProgress = useCallback(
    async (progress: Partial<RowProgress>) => {
      // Debounce — only fire PATCH 500ms after last change
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      pendingProgressRef.current = { ...pendingProgressRef.current, ...progress };
      
      saveTimerRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const token = await getIdToken();
          await fetch(`/api/patterns/${patternId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ rowProgress: pendingProgressRef.current }),
          });
          pendingProgressRef.current = null;
        } catch (err) {
          console.error("Failed to save progress:", err);
        } finally {
          setIsLoading(false);
        }
      }, 500);
    },
    [patternId, getIdToken]
  );

  const increment = useCallback(() => {
    setCurrentRow((prev) => {
      const next = Math.min(prev + 1, totalRows);
      const newComplete = next >= totalRows && totalRows > 0;
      setIsComplete(newComplete);
      saveProgress({ currentRow: next, isComplete: newComplete });
      return next;
    });
  }, [totalRows, saveProgress]);

  const decrement = useCallback(() => {
    setCurrentRow((prev) => {
      const next = Math.max(prev - 1, 0);
      const newComplete = next >= totalRows && totalRows > 0;
      setIsComplete(newComplete);
      saveProgress({ currentRow: next, isComplete: newComplete });
      return next;
    });
  }, [totalRows, saveProgress]);

  const setRow = useCallback((row: number) => {
    const clampedRow = Math.max(0, Math.min(row, totalRows));
    setCurrentRow(clampedRow);
    const newComplete = clampedRow >= totalRows && totalRows > 0;
    setIsComplete(newComplete);
    saveProgress({ currentRow: clampedRow, isComplete: newComplete });
  }, [totalRows, saveProgress]);

  const setTotal = useCallback((total: number) => {
    const clampedTotal = Math.max(1, total);
    setTotalRows(clampedTotal);
    // Adjust current row if it exceeds new total
    setCurrentRow((prev) => {
      const newCurrent = Math.min(prev, clampedTotal);
      const newComplete = newCurrent >= clampedTotal;
      setIsComplete(newComplete);
      saveProgress({ 
        totalRows: clampedTotal, 
        currentRow: newCurrent, 
        isComplete: newComplete 
      });
      return newCurrent;
    });
  }, [saveProgress]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const startCounter = useCallback((totalRows: number) => {
    const total = Math.max(1, totalRows);
    setTotalRows(total);
    setCurrentRow(0);
    setIsComplete(false);
    setIsExpanded(true);
    saveProgress({
      totalRows: total,
      currentRow: 0,
      isComplete: false,
    });
  }, [saveProgress]);

  const markComplete = useCallback(() => {
    setCurrentRow(totalRows);
    setIsComplete(true);
    saveProgress({ currentRow: totalRows, isComplete: true });
  }, [totalRows, saveProgress]);

  const reset = useCallback(() => {
    setCurrentRow(0);
    setIsComplete(false);
    saveProgress({ currentRow: 0, isComplete: false });
  }, [saveProgress]);

  return {
    currentRow,
    totalRows,
    isComplete,
    isExpanded,
    isLoading,
    hasStarted,
    increment,
    decrement,
    setRow,
    setTotal,
    toggleExpanded,
    startCounter,
    markComplete,
    reset,
  };
}

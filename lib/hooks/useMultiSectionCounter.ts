"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useAuth } from "./useAuth";
import type { RowProgress, SectionProgress, LegacyRowProgress } from "../types/pattern";

// Migration helper: convert legacy progress to new format
function migrateLegacyProgress(legacy: LegacyRowProgress): RowProgress {
  const timestamp = legacy.updatedAt;
  return {
    sections: [
      {
        id: "section-1",
        name: "Section 1",
        totalRows: legacy.totalRows,
        currentRow: legacy.currentRow,
        isComplete: legacy.isComplete,
      },
    ],
    activeSectionId: "section-1",
    updatedAt: timestamp,
  };
}

// Type guard to check if progress is legacy format
function isLegacyProgress(progress: unknown): progress is LegacyRowProgress {
  return (
    typeof progress === "object" &&
    progress !== null &&
    "currentRow" in progress &&
    "totalRows" in progress &&
    !("sections" in progress)
  );
}

// Generate a unique section ID
function generateSectionId(): string {
  return `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Slugify section name for ID fallback
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface UseMultiSectionCounterProps {
  patternId: string;
  initialProgress?: RowProgress | LegacyRowProgress;
}

interface UseMultiSectionCounterReturn {
  // Sections data
  sections: SectionProgress[];
  activeSectionId: string;
  activeSection: SectionProgress | null;
  
  // Overall progress
  totalSections: number;
  completedSections: number;
  totalRowsAll: number;
  currentRowsAll: number;
  overallProgress: number; // percentage
  
  // UI state
  isExpanded: boolean;
  isLoading: boolean;
  hasStarted: boolean;
  showSetup: boolean;
  showManagement: boolean;
  toastMessage: string | null;
  
  // Actions
  increment: () => void;
  decrement: () => void;
  setRow: (row: number) => void;
  setSectionRow: (sectionId: string, row: number) => void;
  toggleExpanded: () => void;
  
  // Section management
  addSection: (name: string, totalRows: number) => void;
  updateSection: (sectionId: string, updates: Partial<SectionProgress>) => void;
  deleteSection: (sectionId: string) => void;
  reorderSection: (sectionId: string, direction: "up" | "down") => void;
  setActiveSection: (sectionId: string) => void;
  markSectionComplete: () => void;
  markSectionIncomplete: () => void;
  
  // Setup/Management UI
  startCrocheting: () => void;
  openSetup: () => void;
  closeSetup: () => void;
  openManagement: () => void;
  closeManagement: () => void;
  clearToast: () => void;
  
  // Reset
  resetAll: () => void;
}

export function useMultiSectionCounter({
  patternId,
  initialProgress,
}: UseMultiSectionCounterProps): UseMultiSectionCounterReturn {
  const { getIdToken } = useAuth();

  // Migrate initial progress if needed
  const migratedProgress = useMemo(() => {
    if (!initialProgress) return null;
    if (isLegacyProgress(initialProgress)) {
      return migrateLegacyProgress(initialProgress);
    }
    return initialProgress as RowProgress;
  }, [initialProgress]);

  // State
  const [sections, setSections] = useState<SectionProgress[]>(migratedProgress?.sections ?? []);
  const [activeSectionId, setActiveSectionId] = useState<string>(
    migratedProgress?.activeSectionId ?? ""
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Derived state
  const hasStarted = sections.length > 0;
  const activeSection = sections.find((s) => s.id === activeSectionId) || null;
  
  const totalSections = sections.length;
  const completedSections = sections.filter((s) => s.isComplete).length;
  const totalRowsAll = sections.reduce((sum, s) => sum + s.totalRows, 0);
  const currentRowsAll = sections.reduce((sum, s) => sum + s.currentRow, 0);
  const overallProgress = totalRowsAll > 0 ? Math.round((currentRowsAll / totalRowsAll) * 100) : 0;

  // Sync with initialProgress when it changes
  useEffect(() => {
    if (migratedProgress) {
      setSections(migratedProgress.sections);
      setActiveSectionId(migratedProgress.activeSectionId);
    }
  }, [migratedProgress?.sections, migratedProgress?.activeSectionId]);

  // Debounce ref for saving
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingProgressRef = useRef<Partial<RowProgress> | null>(null);

  const saveProgress = useCallback(
    async (progress: Partial<RowProgress>) => {
      // Debounce — only fire PATCH 500ms after last change
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      pendingProgressRef.current = { ...pendingProgressRef.current, ...progress };

      saveTimerRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const token = await getIdToken();
          const body: { rowProgress: Partial<RowProgress> } = {
            rowProgress: pendingProgressRef.current!,
          };
          await fetch(`/api/patterns/${patternId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
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

  // Counter actions for active section
  const increment = useCallback(() => {
    if (!activeSection) return;
    
    setSections((prev) => {
      const next = prev.map((s) => {
        if (s.id !== activeSectionId) return s;
        const newRow = Math.min(s.currentRow + 1, s.totalRows);
        return {
          ...s,
          currentRow: newRow,
          isComplete: newRow >= s.totalRows,
        };
      });
      saveProgress({ sections: next, activeSectionId });
      return next;
    });
  }, [activeSection, activeSectionId, saveProgress]);

  const decrement = useCallback(() => {
    if (!activeSection) return;
    
    setSections((prev) => {
      const next = prev.map((s) => {
        if (s.id !== activeSectionId) return s;
        const newRow = Math.max(s.currentRow - 1, 0);
        return {
          ...s,
          currentRow: newRow,
          isComplete: newRow >= s.totalRows,
        };
      });
      saveProgress({ sections: next, activeSectionId });
      return next;
    });
  }, [activeSection, activeSectionId, saveProgress]);

  const setRow = useCallback((row: number) => {
    if (!activeSection) return;
    
    setSections((prev) => {
      const next = prev.map((s) => {
        if (s.id !== activeSectionId) return s;
        const clampedRow = Math.max(0, Math.min(row, s.totalRows));
        return {
          ...s,
          currentRow: clampedRow,
          isComplete: clampedRow >= s.totalRows,
        };
      });
      saveProgress({ sections: next, activeSectionId });
      return next;
    });
  }, [activeSection, activeSectionId, saveProgress]);

  const setSectionRow = useCallback((sectionId: string, row: number) => {
    setSections((prev) => {
      const section = prev.find((s) => s.id === sectionId);
      if (!section) return prev;
      
      const clampedRow = Math.max(0, Math.min(row, section.totalRows));
      const next = prev.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          currentRow: clampedRow,
          isComplete: clampedRow >= s.totalRows,
        };
      });
      saveProgress({ sections: next, activeSectionId });
      return next;
    });
  }, [activeSectionId, saveProgress]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Section management
  const addSection = useCallback((name: string, totalRows: number) => {
    const id = generateSectionId();
    const newSection: SectionProgress = {
      id,
      name: name.trim() || "Unnamed Section",
      totalRows: Math.max(1, totalRows),
      currentRow: 0,
      isComplete: false,
    };

    setSections((prev) => {
      const next = [...prev, newSection];
      // If first section, set it as active
      const newActiveId = prev.length === 0 ? id : activeSectionId;
      if (prev.length === 0) {
        setActiveSectionId(id);
      }
      saveProgress({ sections: next, activeSectionId: newActiveId });
      return next;
    });
  }, [activeSectionId, saveProgress]);

  const updateSection = useCallback((sectionId: string, updates: Partial<SectionProgress>) => {
    setSections((prev) => {
      const next = prev.map((s) => {
        if (s.id !== sectionId) return s;
        const newTotal = updates.totalRows !== undefined 
          ? Math.max(1, updates.totalRows) 
          : s.totalRows;
        const newRow = updates.currentRow !== undefined
          ? Math.max(0, Math.min(updates.currentRow, newTotal))
          : Math.min(s.currentRow, newTotal);
        return {
          ...s,
          ...updates,
          totalRows: newTotal,
          currentRow: newRow,
          isComplete: newRow >= newTotal,
        };
      });
      saveProgress({ sections: next, activeSectionId });
      return next;
    });
  }, [activeSectionId, saveProgress]);

  const deleteSection = useCallback((sectionId: string) => {
    setSections((prev) => {
      const next = prev.filter((s) => s.id !== sectionId);
      let newActiveId = activeSectionId;
      
      // If we deleted the active section, pick a new one
      if (activeSectionId === sectionId) {
        // Prefer first incomplete section, or just first section
        const firstIncomplete = next.find((s) => !s.isComplete);
        newActiveId = firstIncomplete?.id || next[0]?.id || "";
        setActiveSectionId(newActiveId);
      }
      
      saveProgress({ sections: next, activeSectionId: newActiveId });
      return next;
    });
  }, [activeSectionId, saveProgress]);

  const reorderSection = useCallback((sectionId: string, direction: "up" | "down") => {
    setSections((prev) => {
      const index = prev.findIndex((s) => s.id === sectionId);
      if (index === -1) return prev;
      
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      
      saveProgress({ sections: next, activeSectionId });
      return next;
    });
  }, [activeSectionId, saveProgress]);

  const setActiveSection = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId);
    saveProgress({ sections, activeSectionId: sectionId });
  }, [sections, saveProgress]);

  const markSectionComplete = useCallback(() => {
    if (!activeSection) return;
    
    setSections((prev) => {
      const next = prev.map((s) => {
        if (s.id !== activeSectionId) return s;
        return { ...s, currentRow: s.totalRows, isComplete: true };
      });
      
      // Find next incomplete section (in order)
      const currentIndex = next.findIndex((s) => s.id === activeSectionId);
      const nextIncomplete = next.slice(currentIndex + 1).find((s) => !s.isComplete)
        || next.slice(0, currentIndex).find((s) => !s.isComplete);
      
      const newActiveId = nextIncomplete?.id || activeSectionId;
      if (nextIncomplete) {
        setActiveSectionId(newActiveId);
        setToastMessage(`${activeSection.name} complete! Starting ${nextIncomplete.name}...`);
      } else {
        setToastMessage(`${activeSection.name} complete! All sections done! 🎉`);
      }
      
      saveProgress({ sections: next, activeSectionId: newActiveId });
      return next;
    });
  }, [activeSection, activeSectionId, saveProgress]);

  const markSectionIncomplete = useCallback(() => {
    if (!activeSection) return;
    
    setSections((prev) => {
      const next = prev.map((s) => {
        if (s.id !== activeSectionId) return s;
        return { ...s, isComplete: false };
      });
      saveProgress({ sections: next, activeSectionId });
      return next;
    });
  }, [activeSection, activeSectionId, saveProgress]);

  // Setup/Management UI
  const startCrocheting = useCallback(() => {
    setShowSetup(false);
    setIsExpanded(true);
  }, []);

  const openSetup = useCallback(() => {
    setShowSetup(true);
  }, []);

  const closeSetup = useCallback(() => {
    setShowSetup(false);
  }, []);

  const openManagement = useCallback(() => {
    setShowManagement(true);
    setIsExpanded(false);
  }, []);

  const closeManagement = useCallback(() => {
    setShowManagement(false);
  }, []);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  // Reset all progress
  const resetAll = useCallback(() => {
    setSections((prev) => {
      const next = prev.map((s) => ({ ...s, currentRow: 0, isComplete: false }));
      saveProgress({ sections: next, activeSectionId });
      return next;
    });
  }, [activeSectionId, saveProgress]);

  return {
    sections,
    activeSectionId,
    activeSection,
    totalSections,
    completedSections,
    totalRowsAll,
    currentRowsAll,
    overallProgress,
    isExpanded,
    isLoading,
    hasStarted,
    showSetup,
    showManagement,
    toastMessage,
    increment,
    decrement,
    setRow,
    setSectionRow,
    toggleExpanded,
    addSection,
    updateSection,
    deleteSection,
    reorderSection,
    setActiveSection,
    markSectionComplete,
    markSectionIncomplete,
    startCrocheting,
    openSetup,
    closeSetup,
    openManagement,
    closeManagement,
    clearToast,
    resetAll,
  };
}

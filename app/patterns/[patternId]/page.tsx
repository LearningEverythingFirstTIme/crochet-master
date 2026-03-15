"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Copy, Printer, Check, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PatternSectionViewer } from "@/components/patterns/PatternSectionViewer";
import { MultiSectionCounter } from "@/components/counter/MultiSectionCounter";
import { useAuth } from "@/lib/hooks/useAuth";
import { useMultiSectionCounter } from "@/lib/hooks/useMultiSectionCounter";
import type { Pattern, RowProgress, LegacyRowProgress } from "@/lib/types/pattern";

export default function PatternDetailPage() {
  const { patternId } = useParams<{ patternId: string }>();
  const router = useRouter();
  const { getIdToken } = useAuth();

  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // debounce ref so we batch rapid toggles into a single PATCH
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCompletedRef = useRef<string[] | null>(null);

  useEffect(() => {
    const fetchPattern = async () => {
      try {
        const token = await getIdToken();
        const res = await fetch(`/api/patterns/${patternId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          router.push("/patterns");
          return;
        }
        const data = await res.json();
        // ensure completedSections is always an array
        setPattern({ ...data, completedSections: data.completedSections ?? [] });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPattern();
  }, [patternId, getIdToken, router]);

  const persistCompleted = useCallback(
    (completed: string[]) => {
      // debounce — only fire PATCH 800ms after last toggle
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      pendingCompletedRef.current = completed;
      saveTimerRef.current = setTimeout(async () => {
        try {
          const token = await getIdToken();
          await fetch(`/api/patterns/${patternId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ completedSections: pendingCompletedRef.current }),
          });
        } catch (err) {
          console.error("Failed to save progress:", err);
        }
      }, 800);
    },
    [patternId, getIdToken]
  );

  const handleToggleSection = useCallback(
    (heading: string) => {
      setPattern((prev) => {
        if (!prev) return prev;
        const current = prev.completedSections ?? [];
        const next = current.includes(heading)
          ? current.filter((h) => h !== heading)
          : [...current, heading];
        persistCompleted(next);
        return { ...prev, completedSections: next };
      });
    },
    [persistCompleted]
  );

  const handleCopy = async () => {
    const text = pattern?.pattern?.rawMarkdown ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this pattern? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const token = await getIdToken();
      await fetch(`/api/patterns/${patternId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push("/patterns");
    } catch {
      setDeleting(false);
    }
  };

  const handlePrint = () => window.print();

  // Multi-section counter state management
  const counter = useMultiSectionCounter({
    patternId,
    initialProgress: pattern?.rowProgress as RowProgress | LegacyRowProgress | undefined,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
        <Header />
        <div className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (!pattern) return null;

  const rawMarkdown = pattern.pattern?.rawMarkdown ?? "";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
      <Header />

      <div className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 pb-32">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-6 print:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/patterns")}
          >
            <ArrowLeft className="h-4 w-4" />
            My Patterns
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Title + badges */}
        <div className="mb-6">
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: "var(--text)", fontFamily: "var(--font-playfair)" }}
          >
            {pattern.title}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            {pattern.pattern?.difficultyLevel && (
              <Badge
                variant="difficulty"
                difficulty={pattern.pattern.difficultyLevel}
              >
                {pattern.pattern.difficultyLevel}
              </Badge>
            )}
            {pattern.pattern?.estimatedTime && (
              <Badge>{pattern.pattern.estimatedTime}</Badge>
            )}
            {pattern.pattern?.yarnWeight && (
              <Badge>{pattern.pattern.yarnWeight}</Badge>
            )}
          </div>
        </div>

        {/* Pattern content — sectioned with progress tracking */}
        <PatternSectionViewer
          rawMarkdown={rawMarkdown}
          completedSections={pattern.completedSections ?? []}
          onToggleSection={handleToggleSection}
        />
      </div>

      {/* Floating Multi-Section Counter */}
      <MultiSectionCounter
        sections={counter.sections}
        activeSectionId={counter.activeSectionId}
        activeSection={counter.activeSection}
        totalSections={counter.totalSections}
        completedSections={counter.completedSections}
        totalRowsAll={counter.totalRowsAll}
        currentRowsAll={counter.currentRowsAll}
        overallProgress={counter.overallProgress}
        isExpanded={counter.isExpanded}
        isLoading={counter.isLoading}
        hasStarted={counter.hasStarted}
        showSetup={counter.showSetup}
        showManagement={counter.showManagement}
        toastMessage={counter.toastMessage}
        increment={counter.increment}
        decrement={counter.decrement}
        setRow={counter.setRow}
        toggleExpanded={counter.toggleExpanded}
        addSection={counter.addSection}
        updateSection={counter.updateSection}
        deleteSection={counter.deleteSection}
        reorderSection={counter.reorderSection}
        setActiveSection={counter.setActiveSection}
        markSectionComplete={counter.markSectionComplete}
        markSectionIncomplete={counter.markSectionIncomplete}
        startCrocheting={counter.startCrocheting}
        openSetup={counter.openSetup}
        closeSetup={counter.closeSetup}
        openManagement={counter.openManagement}
        closeManagement={counter.closeManagement}
        clearToast={counter.clearToast}
        resetAll={counter.resetAll}
      />
    </div>
  );
}

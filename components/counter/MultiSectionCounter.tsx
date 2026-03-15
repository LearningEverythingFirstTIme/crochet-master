"use client";

import { useState, useRef, useEffect } from "react";
import {
  Minus,
  Plus,
  ChevronUp,
  ChevronDown,
  Check,
  RotateCcw,
  Play,
  Settings,
  ChevronRight,
  ChevronLeft,
  Trash2,
  GripVertical,
  X,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SectionProgress } from "@/lib/types/pattern";

interface MultiSectionCounterProps {
  // Sections data
  sections: SectionProgress[];
  activeSectionId: string;
  activeSection: SectionProgress | null;
  
  // Overall progress
  totalSections: number;
  completedSections: number;
  totalRowsAll: number;
  currentRowsAll: number;
  overallProgress: number;
  
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

export function MultiSectionCounter({
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
}: MultiSectionCounterProps) {
  const [isEditingRow, setIsEditingRow] = useState(false);
  const [rowInput, setRowInput] = useState(String(activeSection?.currentRow ?? 0));
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);

  // Setup form state
  const [setupSections, setSetupSections] = useState<Array<{ name: string; totalRows: string }>>([
    { name: "", totalRows: "10" },
  ]);

  // Update row input when active section changes
  useEffect(() => {
    setRowInput(String(activeSection?.currentRow ?? 0));
  }, [activeSection?.currentRow]);

  // Auto-clear toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        clearToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, clearToast]);

  const rowInputRef = useRef<HTMLInputElement>(null);

  const handleRowSubmit = () => {
    const newRow = parseInt(rowInput, 10);
    if (!isNaN(newRow) && newRow >= 0 && activeSection) {
      setRow(newRow);
    }
    setIsEditingRow(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, submitFn: () => void) => {
    if (e.key === "Enter") {
      submitFn();
    } else if (e.key === "Escape") {
      setIsEditingRow(false);
      setRowInput(String(activeSection?.currentRow ?? 0));
    }
  };

  // Setup handlers
  const handleAddSetupSection = () => {
    setSetupSections((prev) => [...prev, { name: "", totalRows: "10" }]);
  };

  const handleRemoveSetupSection = (index: number) => {
    setSetupSections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateSetupSection = (index: number, field: "name" | "totalRows", value: string) => {
    setSetupSections((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleStartCrocheting = () => {
    // Add all valid sections
    let added = false;
    setupSections.forEach(({ name, totalRows }) => {
      const rows = parseInt(totalRows, 10);
      if (name.trim() && !isNaN(rows) && rows >= 1) {
        addSection(name.trim(), rows);
        added = true;
      }
    });
    
    if (added) {
      startCrocheting();
      setSetupSections([{ name: "", totalRows: "10" }]);
    }
  };

  // Setup Modal
  if (showSetup || (!hasStarted && sections.length === 0)) {
    const isSetupOpen = showSetup || !hasStarted;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
              <Layers className="inline-block h-5 w-5 mr-2" />
              Set Up Sections
            </h3>
            {hasStarted && (
              <button
                onClick={closeSetup}
                className="p-1 rounded-lg hover:bg-[var(--bg-muted)]"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Add sections for your pattern (e.g., Head, Body, Arms)
          </p>
          
          <div className="space-y-3 mb-4">
            {setupSections.map((section, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Section name (e.g. Head)"
                    value={section.name}
                    onChange={(e) => handleUpdateSetupSection(index, "name", e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg mb-2"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Total rows"
                    value={section.totalRows}
                    onChange={(e) => handleUpdateSetupSection(index, "totalRows", e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                    min={1}
                  />
                </div>
                {setupSections.length > 1 && (
                  <button
                    onClick={() => handleRemoveSetupSection(index)}
                    className="p-2 rounded-lg hover:bg-red-500/10 mt-1"
                    style={{ color: "var(--error)" }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <Button
            variant="outline"
            className="w-full mb-4"
            onClick={handleAddSetupSection}
          >
            + Add Another Section
          </Button>
          
          <Button
            className="w-full"
            onClick={handleStartCrocheting}
            disabled={!setupSections.some((s) => s.name.trim() && parseInt(s.totalRows, 10) >= 1)}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Crocheting
          </Button>
        </div>
      </div>
    );
  }

  // Management Modal
  if (showManagement) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
              <Settings className="inline-block h-5 w-5 mr-2" />
              Manage Sections
            </h3>
            <button
              onClick={closeManagement}
              className="p-1 rounded-lg hover:bg-[var(--bg-muted)]"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-2 mb-4">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className="p-3 rounded-lg border"
                style={{
                  backgroundColor: "var(--bg-muted)",
                  borderColor: section.id === activeSectionId ? "var(--primary)" : "var(--border)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex flex-col">
                    <button
                      onClick={() => reorderSection(section.id, "up")}
                      disabled={index === 0}
                      className="p-0.5 rounded hover:bg-[var(--bg-input)] disabled:opacity-30"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => reorderSection(section.id, "down")}
                      disabled={index === sections.length - 1}
                      className="p-0.5 rounded hover:bg-[var(--bg-input)] disabled:opacity-30"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    value={section.name}
                    onChange={(e) => updateSection(section.id, { name: e.target.value })}
                    className="flex-1 px-2 py-1 text-sm font-medium rounded"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                  />
                  
                  <button
                    onClick={() => deleteSection(section.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10"
                    style={{ color: "var(--error)" }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Rows:</span>
                  <input
                    type="number"
                    value={section.totalRows}
                    onChange={(e) => updateSection(section.id, { totalRows: parseInt(e.target.value) || 1 })}
                    className="w-20 px-2 py-1 text-sm rounded"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                    min={1}
                  />
                  <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>
                    ({section.currentRow} complete)
                  </span>
                  {section.isComplete && (
                    <span
                      className="ml-auto text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "var(--success-bg)", color: "var(--success)" }}
                    >
                      Done
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                const name = prompt("Section name:");
                const rows = prompt("Total rows:");
                if (name && rows) {
                  const numRows = parseInt(rows, 10);
                  if (!isNaN(numRows) && numRows >= 1) {
                    addSection(name, numRows);
                  }
                }
              }}
            >
              + Add Section
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={resetAll}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Toast notification
  const toast = toastMessage && (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-bottom-2"
      style={{
        backgroundColor: "var(--success-bg)",
        color: "var(--success)",
      }}
    >
      {toastMessage}
    </div>
  );

  // Floating Counter Bar
  return (
    <>
      {toast}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 print:hidden">
        <div
          className="mx-auto max-w-2xl rounded-2xl shadow-2xl border transition-all duration-300"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: activeSection?.isComplete ? "var(--success)" : "var(--border)",
            boxShadow: activeSection?.isComplete
              ? "0 10px 40px -10px rgba(21, 128, 61, 0.3)"
              : "0 10px 40px -10px rgba(0, 0, 0, 0.2)",
          }}
        >
          {/* Collapsed view - always visible */}
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer"
            onClick={toggleExpanded}
          >
            <div className="flex items-center gap-3">
              {/* Overall progress indicator */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: completedSections === totalSections 
                    ? "var(--success-bg)" 
                    : "var(--primary-muted)",
                  color: completedSections === totalSections 
                    ? "var(--success)" 
                    : "var(--primary)",
                }}
              >
                {completedSections === totalSections ? (
                  <Check className="h-5 w-5" />
                ) : (
                  `${completedSections}/${totalSections}`
                )}
              </div>
              
              <div className="flex flex-col">
                {/* Section dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSectionDropdown(!showSectionDropdown);
                    }}
                    className="flex items-center gap-1 font-semibold text-sm hover:opacity-70 transition-opacity"
                    style={{ color: "var(--text)" }}
                  >
                    {activeSection?.name || "Select Section"}
                    <ChevronDown className={`h-4 w-4 transition-transform ${showSectionDropdown ? "rotate-180" : ""}`} />
                  </button>
                  
                  {showSectionDropdown && (
                    <div
                      className="absolute bottom-full left-0 mb-1 w-48 rounded-lg border shadow-lg py-1 z-50"
                      style={{
                        backgroundColor: "var(--bg-card)",
                        borderColor: "var(--border)",
                      }}
                    >
                      {sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSection(section.id);
                            setShowSectionDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-muted)] flex items-center justify-between"
                          style={{ color: section.id === activeSectionId ? "var(--primary)" : "var(--text)" }}
                        >
                          <span>{section.name}</span>
                          {section.isComplete && <Check className="h-3 w-3" style={{ color: "var(--success)" }} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-baseline gap-1">
                  {isEditingRow ? (
                    <input
                      ref={rowInputRef}
                      type="number"
                      value={rowInput}
                      onChange={(e) => setRowInput(e.target.value)}
                      onBlur={handleRowSubmit}
                      onKeyDown={(e) => handleKeyDown(e, handleRowSubmit)}
                      className="w-12 px-1 py-0.5 text-lg font-bold text-center rounded"
                      style={{
                        backgroundColor: "var(--bg-input)",
                        border: "2px solid var(--primary)",
                        color: "var(--text)",
                      }}
                      min={0}
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingRow(true);
                      }}
                      className="text-xl font-bold hover:opacity-70 transition-opacity"
                      style={{ color: activeSection?.isComplete ? "var(--success)" : "var(--text)" }}
                    >
                      {activeSection?.currentRow ?? 0}
                    </button>
                  )}
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                    of {activeSection?.totalRows ?? 0} rows
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Overall progress text */}
              <span className="text-xs hidden sm:inline" style={{ color: "var(--text-muted)" }}>
                {currentRowsAll}/{totalRowsAll}
              </span>
              
              {isLoading && (
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: "var(--primary)" }}
                />
              )}
              <button
                className="p-2 rounded-lg transition-colors"
                style={{ color: "var(--text-muted)" }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded();
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Expanded controls */}
          {isExpanded && (
            <div className="px-4 pb-4 border-t" style={{ borderColor: "var(--border)" }}>
              {/* Section progress bar */}
              <div className="py-3">
                <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                  <span>{activeSection?.name} Progress</span>
                  <span>{Math.round(((activeSection?.currentRow ?? 0) / (activeSection?.totalRows || 1)) * 100)}%</span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--bg-muted)" }}
                >
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${Math.min(((activeSection?.currentRow ?? 0) / (activeSection?.totalRows || 1)) * 100, 100)}%`,
                      backgroundColor: activeSection?.isComplete ? "var(--success)" : "var(--primary)",
                    }}
                  />
                </div>
              </div>
              
              {/* Overall progress bar */}
              <div className="pb-3">
                <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                  <span>Overall Progress ({completedSections}/{totalSections} sections)</span>
                  <span>{overallProgress}%</span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--bg-muted)" }}
                >
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${overallProgress}%`,
                      backgroundColor: completedSections === totalSections ? "var(--success)" : "var(--primary-muted)",
                    }}
                  />
                </div>
              </div>

              {/* Main controls */}
              <div className="flex items-center justify-center gap-4 py-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-full"
                  onClick={decrement}
                  disabled={!activeSection || activeSection.currentRow <= 0}
                >
                  <Minus className="h-6 w-6" />
                </Button>

                <div className="text-center px-4">
                  <div
                    className="text-5xl font-bold"
                    style={{ color: activeSection?.isComplete ? "var(--success)" : "var(--text)" }}
                  >
                    {activeSection?.currentRow ?? 0}
                  </div>
                  <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                    of {activeSection?.totalRows ?? 0}
                  </div>
                </div>

                <Button
                  size="icon"
                  className="h-14 w-14 rounded-full"
                  onClick={increment}
                  disabled={!activeSection || activeSection.currentRow >= activeSection.totalRows}
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-4">
                {activeSection && !activeSection.isComplete ? (
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={markSectionComplete}
                    disabled={!activeSection}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Mark Section Done
                  </Button>
                ) : activeSection ? (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={markSectionIncomplete}
                  >
                    Mark Incomplete
                  </Button>
                ) : null}
                
                <Button
                  variant="outline"
                  onClick={openManagement}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>

              {/* Complete message */}
              {activeSection?.isComplete && (
                <div
                  className="mt-3 text-center py-2 px-3 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: "var(--success-bg)",
                    color: "var(--success)",
                  }}
                >
                  🎉 {activeSection.name} complete!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

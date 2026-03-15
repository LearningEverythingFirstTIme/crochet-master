"use client";

import { useState, useRef, useEffect } from "react";
import { Minus, Plus, ChevronUp, ChevronDown, Check, RotateCcw, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimpleCounterProps {
  currentRow: number;
  totalRows: number;
  isComplete: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  hasStarted: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onSetRow: (row: number) => void;
  onSetTotal: (total: number) => void;
  onToggleExpanded: () => void;
  onStart: (totalRows: number) => void;
  onMarkComplete: () => void;
  onReset: () => void;
}

export function SimpleCounter({
  currentRow,
  totalRows,
  isComplete,
  isExpanded,
  isLoading,
  hasStarted,
  onIncrement,
  onDecrement,
  onSetRow,
  onSetTotal,
  onToggleExpanded,
  onStart,
  onMarkComplete,
  onReset,
}: SimpleCounterProps) {
  const [isEditingRow, setIsEditingRow] = useState(false);
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [rowInput, setRowInput] = useState(String(currentRow));
  const [totalInput, setTotalInput] = useState(String(totalRows || 10));
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [startTotalInput, setStartTotalInput] = useState("10");
  
  const rowInputRef = useRef<HTMLInputElement>(null);
  const totalInputRef = useRef<HTMLInputElement>(null);

  // Update input values when props change
  useEffect(() => {
    setRowInput(String(currentRow));
  }, [currentRow]);

  useEffect(() => {
    setTotalInput(String(totalRows || 10));
  }, [totalRows]);

  // Focus inputs when editing starts
  useEffect(() => {
    if (isEditingRow && rowInputRef.current) {
      rowInputRef.current.focus();
      rowInputRef.current.select();
    }
  }, [isEditingRow]);

  useEffect(() => {
    if (isEditingTotal && totalInputRef.current) {
      totalInputRef.current.focus();
      totalInputRef.current.select();
    }
  }, [isEditingTotal]);

  const handleRowSubmit = () => {
    const newRow = parseInt(rowInput, 10);
    if (!isNaN(newRow) && newRow >= 0) {
      onSetRow(newRow);
    }
    setIsEditingRow(false);
  };

  const handleTotalSubmit = () => {
    const newTotal = parseInt(totalInput, 10);
    if (!isNaN(newTotal) && newTotal >= 1) {
      onSetTotal(newTotal);
    }
    setIsEditingTotal(false);
  };

  const handleStartSubmit = () => {
    const total = parseInt(startTotalInput, 10);
    if (!isNaN(total) && total >= 1) {
      onStart(total);
      setShowStartDialog(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, submitFn: () => void) => {
    if (e.key === "Enter") {
      submitFn();
    } else if (e.key === "Escape") {
      setIsEditingRow(false);
      setIsEditingTotal(false);
      setRowInput(String(currentRow));
      setTotalInput(String(totalRows || 10));
    }
  };

  // Start dialog overlay
  if (showStartDialog) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
        <div className="mx-auto max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>
            Start Counter
          </h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            How many rows in this section?
          </p>
          <input
            type="number"
            value={startTotalInput}
            onChange={(e) => setStartTotalInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleStartSubmit();
              if (e.key === "Escape") setShowStartDialog(false);
            }}
            className="w-full px-4 py-3 text-2xl font-bold text-center rounded-xl mb-4"
            style={{
              backgroundColor: "var(--bg-input)",
              border: "2px solid var(--border-strong)",
              color: "var(--text)",
            }}
            min={1}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowStartDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleStartSubmit}
            >
              Start
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Start button (when no counter started)
  if (!hasStarted) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 print:hidden">
        <div className="mx-auto max-w-2xl">
          <Button
            size="lg"
            className="w-full shadow-lg"
            onClick={() => setShowStartDialog(true)}
          >
            <Play className="h-5 w-5 mr-2" />
            Start Counter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 print:hidden">
      <div
        className="mx-auto max-w-2xl rounded-2xl shadow-2xl border transition-all duration-300"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: isComplete ? "var(--success)" : "var(--border)",
          boxShadow: isComplete
            ? "0 10px 40px -10px rgba(21, 128, 61, 0.3)"
            : "0 10px 40px -10px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Collapsed view - always visible */}
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer"
          onClick={onToggleExpanded}
        >
          <div className="flex items-center gap-3">
            {isComplete ? (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--success-bg)" }}
              >
                <Check className="h-5 w-5" style={{ color: "var(--success)" }} />
              </div>
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--primary-muted)" }}
              >
                <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>
                  {Math.round((currentRow / totalRows) * 100)}%
                </span>
              </div>
            )}
            <div className="flex items-baseline gap-1">
              {isEditingRow ? (
                <input
                  ref={rowInputRef}
                  type="number"
                  value={rowInput}
                  onChange={(e) => setRowInput(e.target.value)}
                  onBlur={handleRowSubmit}
                  onKeyDown={(e) => handleKeyDown(e, handleRowSubmit)}
                  className="w-16 px-2 py-1 text-xl font-bold text-center rounded"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    border: "2px solid var(--primary)",
                    color: "var(--text)",
                  }}
                  min={0}
                />
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingRow(true);
                  }}
                  className="text-2xl font-bold hover:opacity-70 transition-opacity"
                  style={{ color: "var(--text)" }}
                >
                  {currentRow}
                </button>
              )}
              <span className="text-lg" style={{ color: "var(--text-muted)" }}>
                of
              </span>
              {isEditingTotal ? (
                <input
                  ref={totalInputRef}
                  type="number"
                  value={totalInput}
                  onChange={(e) => setTotalInput(e.target.value)}
                  onBlur={handleTotalSubmit}
                  onKeyDown={(e) => handleKeyDown(e, handleTotalSubmit)}
                  className="w-16 px-2 py-1 text-xl font-bold text-center rounded"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    border: "2px solid var(--primary)",
                    color: "var(--text)",
                  }}
                  min={1}
                />
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTotal(true);
                  }}
                  className="text-2xl font-bold hover:opacity-70 transition-opacity"
                  style={{ color: "var(--text)" }}
                >
                  {totalRows}
                </button>
              )}
              <span className="text-sm ml-1" style={{ color: "var(--text-muted)" }}>
                rows
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
                onToggleExpanded();
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
            {/* Progress bar */}
            <div className="py-3">
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--bg-muted)" }}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${Math.min((currentRow / totalRows) * 100, 100)}%`,
                    backgroundColor: isComplete ? "var(--success)" : "var(--primary)",
                  }}
                />
              </div>
            </div>

            {/* Main controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-full"
                onClick={onDecrement}
                disabled={currentRow <= 0}
              >
                <Minus className="h-6 w-6" />
              </Button>

              <div className="text-center px-4">
                <div
                  className="text-4xl font-bold"
                  style={{ color: isComplete ? "var(--success)" : "var(--text)" }}
                >
                  {currentRow}
                </div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                  of {totalRows}
                </div>
              </div>

              <Button
                size="icon"
                className="h-14 w-14 rounded-full"
                onClick={onIncrement}
                disabled={currentRow >= totalRows}
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
              {!isComplete ? (
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={onMarkComplete}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark Done
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onReset}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>

            {/* Complete message */}
            {isComplete && (
              <div
                className="mt-3 text-center py-2 px-3 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: "var(--success-bg)",
                  color: "var(--success)",
                }}
              >
                🎉 Section complete! Great job!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

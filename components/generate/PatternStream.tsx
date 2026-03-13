"use client";

import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatternStreamProps {
  text: string;
  isStreaming: boolean;
  error: string | null;
}

export function PatternStream({ text, isStreaming, error }: PatternStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll while streaming
  useEffect(() => {
    if (isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [text, isStreaming]);

  if (error) {
    return (
      <div
        className="rounded-xl border px-5 py-4 text-sm"
        style={{
          backgroundColor: "var(--error-bg)",
          borderColor: "var(--error-border)",
          color: "var(--error)",
        }}
      >
        <p className="font-semibold mb-1">Something went wrong</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!text && !isStreaming) return null;

  return (
    <div
      className="rounded-2xl border shadow-sm overflow-hidden"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      {/* Header bar */}
      <div
        className="flex items-center gap-2 border-b px-5 py-3"
        style={{ backgroundColor: "var(--primary-muted)", borderColor: "var(--border)" }}
      >
        <BookOpen className="h-4 w-4" style={{ color: "var(--primary)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
          Your Pattern
        </span>
        {isStreaming && (
          <span
            className="ml-auto flex items-center gap-1.5 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating…
          </span>
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          "px-6 py-5 prose prose-sm max-w-none",
          "prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3 prose-h2:pb-1",
          "prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2",
          "prose-p:leading-relaxed",
          "prose-code:px-1 prose-code:rounded prose-code:text-sm",
          "prose-table:text-sm"
        )}
        style={{
          "--tw-prose-body":       "var(--text)",
          "--tw-prose-headings":   "var(--primary)",
          "--tw-prose-lead":       "var(--text-muted)",
          "--tw-prose-links":      "var(--primary)",
          "--tw-prose-bold":       "var(--text)",
          "--tw-prose-counters":   "var(--text-muted)",
          "--tw-prose-bullets":    "var(--primary)",
          "--tw-prose-hr":         "var(--border)",
          "--tw-prose-code":       "var(--primary)",
          "--tw-prose-pre-bg":     "var(--bg-muted)",
          "--tw-prose-th-borders": "var(--border)",
          "--tw-prose-td-borders": "var(--border)",
        } as React.CSSProperties}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {text + (isStreaming ? "▍" : "")}
        </ReactMarkdown>
      </div>

      <div ref={bottomRef} />
    </div>
  );
}

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
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
        <p className="font-semibold mb-1">Something went wrong</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!text && !isStreaming) return null;

  return (
    <div className="rounded-2xl border border-rose-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-rose-100 bg-rose-50/50 px-5 py-3">
        <BookOpen className="h-4 w-4 text-rose-400" />
        <span className="text-sm font-semibold text-rose-700">
          Your Pattern
        </span>
        {isStreaming && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-rose-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating...
          </span>
        )}
      </div>

      {/* Pattern content */}
      <div
        className={cn(
          "px-6 py-5 prose prose-sm max-w-none",
          "prose-headings:text-rose-800 prose-headings:font-semibold",
          "prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3 prose-h2:border-b prose-h2:border-rose-100 prose-h2:pb-1",
          "prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-rose-700",
          "prose-p:text-gray-700 prose-p:leading-relaxed",
          "prose-li:text-gray-700",
          "prose-strong:text-gray-800",
          "prose-code:bg-rose-50 prose-code:text-rose-700 prose-code:px-1 prose-code:rounded",
          "prose-table:text-sm",
          "prose-th:bg-rose-50 prose-th:text-rose-700"
        )}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {text + (isStreaming ? "▍" : "")}
        </ReactMarkdown>
      </div>

      <div ref={bottomRef} />
    </div>
  );
}

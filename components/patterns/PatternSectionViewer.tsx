"use client";

import { useMemo, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Section {
  heading: string;
  content: string;
}

function parseMarkdownSections(markdown: string): {
  preamble: string;
  sections: Section[];
} {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let preambleLines: string[] = [];
  let currentHeading: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      if (currentHeading !== null) {
        sections.push({ heading: currentHeading, content: currentLines.join("\n").trim() });
      } else {
        preambleLines = [...currentLines];
      }
      currentHeading = h2Match[1].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // flush last section
  if (currentHeading !== null) {
    sections.push({ heading: currentHeading, content: currentLines.join("\n").trim() });
  } else {
    preambleLines = [...currentLines];
  }

  return { preamble: preambleLines.join("\n").trim(), sections };
}

const PROSE_STYLE: React.CSSProperties = {
  "--tw-prose-body": "var(--text)",
  "--tw-prose-headings": "var(--primary)",
  "--tw-prose-lead": "var(--text-muted)",
  "--tw-prose-links": "var(--primary)",
  "--tw-prose-bold": "var(--text)",
  "--tw-prose-counters": "var(--text-muted)",
  "--tw-prose-bullets": "var(--primary)",
  "--tw-prose-hr": "var(--border)",
  "--tw-prose-code": "var(--primary)",
  "--tw-prose-pre-bg": "var(--bg-muted)",
  "--tw-prose-th-borders": "var(--border)",
  "--tw-prose-td-borders": "var(--border)",
} as React.CSSProperties;

interface PatternSectionViewerProps {
  rawMarkdown: string;
  completedSections: string[];
  onToggleSection: (heading: string) => void;
}

export function PatternSectionViewer({
  rawMarkdown,
  completedSections,
  onToggleSection,
}: PatternSectionViewerProps) {
  const { preamble, sections } = useMemo(
    () => parseMarkdownSections(rawMarkdown),
    [rawMarkdown]
  );

  const completedSet = useMemo(() => new Set(completedSections), [completedSections]);
  const completedCount = sections.filter((s) => completedSet.has(s.heading)).length;
  const totalCount = sections.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {totalCount > 0 && (
        <div
          className="sticky top-0 z-10 rounded-xl border px-4 py-3 shadow-sm print:hidden"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Progress
            </span>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              {completedCount} of {totalCount} sections
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--bg-muted)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                backgroundColor: progressPct === 100 ? "var(--success)" : "var(--primary)",
              }}
            />
          </div>
          {progressPct === 100 && (
            <p className="mt-2 text-xs font-medium" style={{ color: "var(--success)" }}>
              🎉 Pattern complete!
            </p>
          )}
        </div>
      )}

      {/* Preamble (content before first ## heading) */}
      {preamble && (
        <div
          className={cn(
            "rounded-2xl border px-6 py-5 shadow-sm",
            "prose prose-sm max-w-none",
            "prose-headings:font-semibold",
            "prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2",
            "prose-p:leading-relaxed",
            "prose-code:px-1 prose-code:rounded prose-code:text-sm",
            "prose-table:text-sm"
          )}
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border)",
            ...PROSE_STYLE,
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{preamble}</ReactMarkdown>
        </div>
      )}

      {/* Sections */}
      {sections.map((section) => {
        const isDone = completedSet.has(section.heading);
        return (
          <div
            key={section.heading}
            className="rounded-2xl border shadow-sm overflow-hidden transition-all duration-200"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: isDone ? "var(--success-border)" : "var(--border)",
            }}
          >
            {/* Section header (clickable toggle) */}
            <button
              onClick={() => onToggleSection(section.heading)}
              className="w-full flex items-center gap-3 px-6 py-4 text-left print:pointer-events-none"
              style={{
                backgroundColor: isDone ? "var(--success-bg)" : "transparent",
              }}
            >
              {isDone ? (
                <CheckCircle2
                  className="h-5 w-5 flex-shrink-0"
                  style={{ color: "var(--success)" }}
                />
              ) : (
                <Circle
                  className="h-5 w-5 flex-shrink-0"
                  style={{ color: "var(--text-muted)" }}
                />
              )}
              <span
                className={cn("text-base font-semibold flex-1", isDone && "line-through")}
                style={{
                  color: isDone ? "var(--success)" : "var(--primary)",
                  fontFamily: "var(--font-playfair)",
                }}
              >
                {section.heading}
              </span>
              <span
                className="text-xs print:hidden"
                style={{ color: "var(--text-muted)" }}
              >
                {isDone ? "Mark incomplete" : "Mark complete"}
              </span>
            </button>

            {/* Section body */}
            {section.content && (
              <div
                className={cn(
                  "px-6 py-4 border-t",
                  "prose prose-sm max-w-none",
                  "prose-headings:font-semibold",
                  "prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2",
                  "prose-p:leading-relaxed",
                  "prose-code:px-1 prose-code:rounded prose-code:text-sm",
                  "prose-table:text-sm",
                  isDone && "opacity-50"
                )}
                style={{
                  borderColor: isDone ? "var(--success-border)" : "var(--border)",
                  ...PROSE_STYLE,
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {section.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

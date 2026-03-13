import Link from "next/link";
import { Clock, ImageIcon, Type } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PatternSummary } from "@/lib/types/pattern";

interface PatternCardProps {
  pattern: PatternSummary;
}

export function PatternCard({ pattern }: PatternCardProps) {
  return (
    <Link
      href={`/patterns/${pattern.id}`}
      className="group block rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3
          className="font-semibold text-sm leading-snug line-clamp-2"
          style={{ color: "var(--text)" }}
        >
          {pattern.title}
        </h3>
        <div className="flex-shrink-0">
          {pattern.sourceType === "image" ? (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ backgroundColor: "var(--bg-muted)" }}
            >
              <ImageIcon className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
            </div>
          ) : (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ backgroundColor: "var(--primary-muted)" }}
            >
              <Type className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
            </div>
          )}
        </div>
      </div>

      {pattern.description && (
        <p className="text-xs line-clamp-2 mb-3" style={{ color: "var(--text-muted)" }}>
          {pattern.description}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {pattern.difficultyLevel && (
          <Badge variant="difficulty" difficulty={pattern.difficultyLevel}>
            {pattern.difficultyLevel}
          </Badge>
        )}
        {pattern.estimatedTime && (
          <span
            className="flex items-center gap-1 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            <Clock className="h-3 w-3" />
            {pattern.estimatedTime}
          </span>
        )}
        {pattern.createdAt && (
          <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
            {new Date(
              typeof pattern.createdAt === "object" && "toDate" in pattern.createdAt
                ? (pattern.createdAt as { toDate: () => Date }).toDate()
                : pattern.createdAt
            ).toLocaleDateString()}
          </span>
        )}
      </div>
    </Link>
  );
}

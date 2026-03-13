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
      className="block rounded-2xl bg-white border border-rose-100 p-5 shadow-sm hover:shadow-md hover:border-rose-200 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">
          {pattern.title}
        </h3>
        <div className="flex-shrink-0">
          {pattern.sourceType === "image" ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100">
              <ImageIcon className="h-3.5 w-3.5 text-purple-500" />
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100">
              <Type className="h-3.5 w-3.5 text-rose-500" />
            </div>
          )}
        </div>
      </div>

      {pattern.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
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
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            {pattern.estimatedTime}
          </span>
        )}
        {pattern.createdAt && (
          <span className="ml-auto text-xs text-gray-400">
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

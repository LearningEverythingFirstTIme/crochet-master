import { cn } from "@/lib/utils";

const difficultyColors: Record<string, string> = {
  beginner:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  intermediate: "bg-amber-100   text-amber-700   dark:bg-amber-900/40   dark:text-amber-300",
  advanced:     "bg-red-100     text-red-700     dark:bg-red-900/40     dark:text-red-300",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "difficulty";
  difficulty?: string;
  className?: string;
}

export function Badge({ children, variant = "default", difficulty, className }: BadgeProps) {
  const colorClass =
    variant === "difficulty" && difficulty
      ? difficultyColors[difficulty] ?? "bg-[var(--bg-muted)] text-[var(--text-muted)]"
      : "bg-[var(--primary-muted)] text-[var(--primary)]";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        colorClass,
        className
      )}
    >
      {children}
    </span>
  );
}

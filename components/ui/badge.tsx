import { cn } from "@/lib/utils";

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-yellow-100 text-yellow-700",
  advanced: "bg-red-100 text-red-700",
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
      ? difficultyColors[difficulty] ?? "bg-gray-100 text-gray-700"
      : "bg-rose-100 text-rose-700";

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

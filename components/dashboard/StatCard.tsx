import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "secondary" | "accent" | "background";

const toneStyles: Record<
  Tone,
  { icon: string; ring: string; value: string }
> = {
  primary: {
    icon: "bg-primary-100 text-primary-600 dark:bg-primary-300/15 dark:text-primary-500",
    ring: "ring-primary-100/80 dark:ring-primary-300/20",
    value: "text-primary-700 dark:text-primary-400",
  },
  secondary: {
    icon: "bg-secondary-100 text-secondary-600 dark:bg-secondary-300/15 dark:text-secondary-400",
    ring: "ring-secondary-100/80 dark:ring-secondary-300/20",
    value: "text-secondary-700 dark:text-secondary-400",
  },
  accent: {
    icon: "bg-accent-100 text-accent-600 dark:bg-accent-300/15 dark:text-accent-400",
    ring: "ring-accent-100/80 dark:ring-accent-300/20",
    value: "text-accent-700 dark:text-accent-400",
  },
  background: {
    icon: "bg-background-100 text-background-600 dark:bg-background-300/15",
    ring: "ring-background-100/80",
    value: "text-background-700 dark:text-text-800",
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
}) {
  const styles = toneStyles[tone];
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;

  return (
    <div
      className={`flex h-full min-w-0 flex-col rounded-2xl border border-divider bg-surface p-4 shadow-card ring-1 sm:p-5 ${styles.ring} transition-shadow hover:shadow-soft dark:shadow-card-dark`}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-snug text-text-500 sm:text-sm">{label}</p>
          <p
            className={`mt-1.5 truncate text-xl font-bold tabular-nums tracking-tight sm:mt-2 sm:text-2xl xl:text-[1.65rem] ${styles.value}`}
            title={String(displayValue)}
          >
            {displayValue}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${styles.icon}`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </div>
  );
}

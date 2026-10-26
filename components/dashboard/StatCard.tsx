import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "secondary" | "accent" | "background";

const toneStyles: Record<
  Tone,
  { icon: string; ring: string; value: string }
> = {
  primary: {
    icon: "bg-primary-100 text-primary-600",
    ring: "ring-primary-100",
    value: "text-primary-700",
  },
  secondary: {
    icon: "bg-secondary-100 text-secondary-600",
    ring: "ring-secondary-100",
    value: "text-secondary-700",
  },
  accent: {
    icon: "bg-accent-100 text-accent-600",
    ring: "ring-accent-100",
    value: "text-accent-700",
  },
  background: {
    icon: "bg-background-100 text-background-600",
    ring: "ring-background-100",
    value: "text-background-700",
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

  return (
    <div
      className={`rounded-2xl border border-divider bg-surface p-5 shadow-card ring-1 ${styles.ring} transition-shadow hover:shadow-soft dark:shadow-card-dark`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-500">{label}</p>
          <p className={`mt-2 text-3xl font-bold tracking-tight ${styles.value}`}>
            {value}
          </p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </div>
  );
}

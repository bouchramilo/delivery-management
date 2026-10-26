import { formatCurrency } from "@/lib/format";
import { MapPin, Package, ShoppingBag, TrendingUp } from "lucide-react";

const miniStats = [
  { label: "Zones", value: "12", icon: MapPin, tone: "text-primary-600 bg-primary-100" },
  { label: "Orders", value: "248", icon: ShoppingBag, tone: "text-secondary-600 bg-secondary-100" },
  { label: "Revenue", value: formatCurrency(12450), icon: TrendingUp, tone: "text-accent-600 bg-accent-100" },
];

export function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-md md:max-w-lg lg:mx-0 lg:max-w-xl">
      <div
        className="pointer-events-none absolute -left-6 top-8 h-32 w-32 rounded-full bg-primary-300/25 blur-3xl dark:bg-primary-500/15"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-4 bottom-4 h-36 w-36 rounded-full bg-secondary-300/30 blur-3xl dark:bg-secondary-500/15"
        aria-hidden
      />

      <div
        className="relative overflow-hidden rounded-3xl border border-divider bg-surface shadow-soft ring-1 ring-black/[0.04] dark:shadow-card-dark dark:ring-white/[0.06]"
        aria-hidden
      >
        <div className="flex items-center gap-2 border-b border-divider bg-surface-muted/60 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-accent-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary-300/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-secondary-300/80" />
          </div>
          <p className="ml-2 truncate text-xs font-medium text-text-500">
            Delivery Manager · Zone coverage
          </p>
        </div>

        <div className="p-4">
          <div className="relative aspect-[5/4] overflow-hidden rounded-2xl border border-divider bg-gradient-to-br from-primary-50 via-background-50 to-secondary-50 dark:from-primary-300/10 dark:via-background-200/20 dark:to-secondary-300/10">
            <div
              className="absolute inset-0 opacity-[0.35] dark:opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--primary-400) 35%, transparent) 1px, transparent 0)",
                backgroundSize: "20px 20px",
              }}
            />

            <div
              className="absolute left-[12%] top-[22%] h-[38%] w-[38%] rounded-full border-2 border-primary-400/50 bg-primary-400/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]"
            />
            <div
              className="absolute right-[10%] top-[38%] h-[28%] w-[28%] rounded-full border-2 border-secondary-400/55 bg-secondary-400/12"
            />
            <div
              className="absolute left-[42%] top-[52%] h-[22%] w-[22%] rounded-full border-2 border-emerald-500/50 bg-emerald-500/15"
            />

            <div className="absolute left-[48%] top-[58%] flex -translate-x-1/2 -translate-y-full flex-col items-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white shadow-md ring-4 ring-white/80 dark:ring-surface/80">
                <MapPin className="h-4 w-4" aria-hidden />
              </span>
              <span className="mt-1 rounded-md bg-surface/95 px-2 py-0.5 text-[10px] font-semibold text-text-700 shadow-sm backdrop-blur-sm">
                Customer
              </span>
            </div>

            <div className="absolute left-3 top-3 rounded-lg bg-surface/90 px-2.5 py-1.5 text-[10px] font-medium text-text-600 shadow-sm backdrop-blur-sm">
              Casablanca · Rabat · Midelt
            </div>

            <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-divider/80 bg-surface/95 p-2.5 shadow-md backdrop-blur-md">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                    <Package className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-text-900">Fresh produce box</p>
                    <p className="text-[10px] text-text-500">Zone Midelt · Qty 2</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  Accepted
                </span>
              </div>
            </div>
          </div>

          <ul className="mt-3 grid grid-cols-3 gap-2">
            {miniStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <li
                  key={stat.label}
                  className="rounded-xl border border-divider bg-surface-muted/50 px-2 py-2 text-center"
                >
                  <div
                    className={`mx-auto flex h-7 w-7 items-center justify-center rounded-lg ${stat.tone}`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </div>
                  <p className="mt-1 truncate text-[10px] font-medium text-text-500">{stat.label}</p>
                  <p className="truncate text-xs font-bold tabular-nums text-text-800">{stat.value}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
